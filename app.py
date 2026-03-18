import os
import pandas as pd
import json
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
from datetime import datetime

app = Flask(__name__)
DATA_FILE = 'data.json'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def _load_data():
    if not os.path.exists(DATA_FILE):
        return {'mappings': [], 'dashboard_rows': []}
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading JSON data: {e}")
        return {'mappings': [], 'dashboard_rows': []}

def _save_data(data):
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving JSON data: {e}")

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/mappings', methods=['GET', 'POST'])
def handle_mappings():
    data = _load_data()
    if request.method == 'POST':
        try:
            mappings = request.json
            if not isinstance(mappings, list):
                return jsonify({'error': 'Invalid data format'}), 400
            
            # Simple sanitization
            sanitized_mappings = []
            for m in mappings:
                desc = m.get('description', '').strip()
                nick = m.get('nickname', '').strip()
                if desc and nick:
                    sanitized_mappings.append({
                        'description': desc,
                        'nickname': nick,
                        'created_at': datetime.utcnow().isoformat()
                    })
            
            data['mappings'] = sanitized_mappings
            _save_data(data)
            return jsonify({'status': 'success'})
        except Exception as e:
            print(f"Error saving mappings: {e}")
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify(data.get('mappings', []))

@app.route('/dashboard', methods=['GET'])
def get_dashboard():
    data = _load_data()
    rows = data.get('dashboard_rows', [])
    rows.sort(key=lambda x: x.get('order', 0))
    return jsonify(rows)

@app.route('/save_dashboard', methods=['POST'])
def save_dashboard():
    try:
        request_data = request.json
        rows = request_data.get('rows', [])
        
        data = _load_data()
        
        # Add metadata and order
        for index, row in enumerate(rows):
            row['created_at'] = datetime.utcnow().isoformat()
            row['order'] = index
            
        data['dashboard_rows'] = rows
        _save_data(data)
            
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error saving dashboard: {e}")
        return jsonify({'error': str(e)}), 500

# ... (imports are now at the top)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    mappings_json = request.form.get('mappings', '[]')
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        # Save the original file to disk
        ext = os.path.splitext(file.filename)[1].lower()
        original_path = os.path.join(UPLOAD_FOLDER, f"current_base{ext}")
        file.save(original_path)
        
        if ext == '.csv':
            df = pd.read_csv(original_path)
        else:
            df = pd.read_excel(original_path)
            
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # Matching Logic
        import json
        mappings = json.loads(mappings_json) # List of {description, nickname}
        
        # Persistence: Save mappings to JSON
        try:
            current_data = _load_data()
            new_mappings = []
            for m in mappings:
                desc = m.get('description', '').strip()
                nick = m.get('nickname', '').strip()
                if desc and nick:
                    # Update or add
                    found = False
                    for existing in current_data['mappings']:
                        if existing['description'] == desc and existing['nickname'] == nick:
                            found = True
                            break
                    if not found:
                        new_mappings.append({
                            'description': desc,
                            'nickname': nick,
                            'created_at': datetime.utcnow().isoformat()
                        })
            
            if new_mappings:
                current_data['mappings'].extend(new_mappings)
                _save_data(current_data)
        except Exception as e:
            print(f"Warning: Could not save mappings to JSON: {e}")

        aggregated_results = {} # nickname -> {buyer: 0, unit: 0, sale: 0}

        for index, row in df.iterrows():
            row_str = " ".join([str(val).lower() for val in row.values])
            for mapping in mappings:
                desc = mapping.get('description', '').lower().strip()
                nickname = mapping.get('nickname', '').strip()
                if not desc or not nickname: continue
                
                if desc in row_str:
                    if nickname not in aggregated_results:
                        aggregated_results[nickname] = {'buyer': 0, 'unit': 0, 'sale': 0}
                    
                    # Try to extract numbers from columns with robust variations
                    col_map = {
                        'buyer': ['buyer', 'buyers', 'customer', 'customers'],
                        'unit': ['unit', 'units', 'unite', 'qty', 'quantity', 'count'],
                        'sale': ['sale', 'sales', 'total sale', 'total sales', 'amount', 'price']
                    }
                    
                    for norm_col, variants in col_map.items():
                        for variant in variants:
                            if variant in df.columns:
                                val = row[variant]
                                try:
                                    # Convert to float, handle non-numeric softly
                                    if pd.notnull(val):
                                        # Remove common currency symbols and commas
                                        if isinstance(val, str):
                                            val = val.replace('$', '').replace(',', '').replace('¥', '').strip()
                                        num_val = float(val)
                                        aggregated_results[nickname][norm_col] += num_val
                                        break # Found a match for this category, move to next norm_col
                                except (ValueError, TypeError):
                                    pass
                    break # Assuming one mapping match per row

        # Persistence: Log aggregated results to JSON
        try:
            current_data = _load_data()
            if 'aggregate_results' not in current_data:
                current_data['aggregate_results'] = []
            
            current_data['aggregate_results'].append({
                'filename': file.filename,
                'results': aggregated_results,
                'created_at': datetime.utcnow().isoformat()
            })
            _save_data(current_data)
        except Exception as e:
            print(f"Warning: Could not log results to JSON: {e}")

        return jsonify({
            'columns': df.columns.tolist(), 
            'original_data': df.fillna('').to_dict(orient='records'),
            'filename': file.filename,
            'aggregated_results': aggregated_results
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate_file():
    data = request.json
    dashboard_list = data.get('dashboard_data', [])
    filename = data.get('filename', 'updated_file.xlsx')

    try:
        # Check for both possible base file names
        base_xlsx = os.path.join(UPLOAD_FOLDER, "current_base.xlsx")
        base_csv = os.path.join(UPLOAD_FOLDER, "current_base.csv")
        base_xls = os.path.join(UPLOAD_FOLDER, "current_base.xls")
        
        original_path = None
        for p in [base_xlsx, base_csv, base_xls]:
            if os.path.exists(p):
                original_path = p
                break

        if not original_path:
            return jsonify({'error': 'No file uploaded yet'}), 400

        ext = os.path.splitext(original_path)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(original_path)
        else:
            df = pd.read_excel(original_path)

        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # User requested mappings for matching
        dashboard_map = {str(item['name']).strip().lower(): item for item in dashboard_list if item.get('name')}

        def update_row(row):
            # Try to match the name in the row with any key in the dashboard map
            row_name = str(row['name']).strip().lower() if 'name' in row else ""
            for dash_name_key, dash_values in dashboard_map.items():
                if dash_name_key in row_name:
                    if 'name' in df.columns: row['name'] = dash_values['name']
                    for col in ['buyer', 'unit', 'sale']:
                        target_col = col
                        if col not in df.columns and col == 'unit' and 'unite' in df.columns:
                            target_col = 'unite'
                        
                        if target_col in df.columns:
                            val = dash_values.get(col, '0')
                            if val == '': val = '0'
                            row[target_col] = val
                    break
            return row

        df = df.apply(update_row, axis=1)
        
        updated_filename = "updated_" + filename
        updated_path = os.path.join(UPLOAD_FOLDER, updated_filename)

        if ext == '.csv':
            df.to_csv(updated_path, index=False)
        else:
            with pd.ExcelWriter(updated_path, engine='openpyxl') as writer:
                df.to_excel(writer, index=False)

        return jsonify({'download_url': f'/download/{updated_filename}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
