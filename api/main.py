from flask import Flask
from flask import request
from flask import jsonify, json, send_file
# from flask_api import status
from flask_cors import CORS
import subprocess
from io import StringIO
import pandas as pd
from pandas_profiling import ProfileReport
from zipfile import ZipFile
import simplejson as py_json
import os
import sys
import inspect
import shutil
import yaml
import utils



app = Flask(__name__)
CORS(app)

# Switch paths and import FCparser
# sys.stdout = open('randomfile.txt', 'w')
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
# sys.path.insert(0, parentdir)
# sys.path.append(os.getcwd().replace('api', 'bin'))
# import fcparser
# config_path = parentdir + '/example/config/configuration.yaml'
# os.chdir(parentdir)
#

@app.route('/api/upload', methods = ['POST'])
def upload_file():
    print('Upload_file started')
    uploaded_files = request.files.getlist("files[]")
    if uploaded_files:
        session_id = utils.generate_session_id()
        utils.generate_template_file(session_id)
        # Decode and store data set
        tmp = StringIO(uploaded_files[0].read().decode('utf-8'))
        with open('../example/Examples_data/' + str(session_id) + '.csv', 'w') as fd:
            tmp.seek(0)
            shutil.copyfileobj(tmp, fd)

        # Split head for response
        head = ""
        tmp.seek(0)
        for i in range(0, 60):
            head += tmp.readline()
            
        tmp.seek(0)
        df = pd.read_csv(tmp)

        profile = ProfileReport(df, title="Pandas Profiling Report", 
            vars={"num": {"low_categorical_threshold": 0}},
            missing_diagrams={
                "bar": False,
                "matrix": False,
                "heatmap": False,
                "dendrogram": False,
            },
            interactions = {
                "continuous": False
            }
        )
        json_analysis = profile.to_json()
        dict_analysis = py_json.loads(json_analysis)
        dict_analysis['scatter'] = None
        dict_analysis['missing'] = None

        # profile.to_file("full_report.html")
        # profile.to_file("full_report.json")

        newdf = df.infer_objects()
        column_info = newdf.dtypes.astype(str).to_dict()
        
        return jsonify(
            status = 'success',
            session_id = session_id,
            analysis = py_json.dumps(dict_analysis, ignore_nan=True),
            columns = column_info,
            head = head
        )
    return jsonify(
        status = "error"
    )

@app.route('/api/parser', methods = ['POST'])
def run_fcparser():
    print('run fcparser started')
    uploaded_files = request.files.getlist("files[]")
    print('1')
    config_files = None
    if "config[]" in request.form:
        config_files = request.form["config[]"]
    print('2')
    print(type(uploaded_files))
    print('3')
    print(uploaded_files)
    if uploaded_files:
        tmp = StringIO(uploaded_files[0].read().decode('utf-8'))
        session_id = utils.generate_session_id()
        print('session_id: ', session_id)
        if config_files != None:
            with open("../example/config/" + session_id + ".yaml", "w") as file:
                file.write(config_files)

        subprocess.Popen(["python3", "utils.py", session_id])
        return jsonify( 
            message = 'success',
            session_id = session_id,
        ), 202
    else:
        if request.form['session_id'] != None:
            print('session_id: ', request.form['session_id'])
            if config_files != None:
                with open("../example/config/" + request.form['session_id'] + ".yaml", "w") as file:
                    file.write(config_files)

            subprocess.Popen(["python3", "utils.py", request.form['session_id']])
            return jsonify( message = "success" ), 202
            
    return jsonify( message = "error something" ), 400

@app.route('/api/status/<session_id>', methods = ['GET'])
def check_status(session_id):
    if os.path.exists("log/" + session_id + ".zip"):
        return jsonify(messsage = "finished"), 200
    else:
        if os.path.exists("log_" + session_id + ".txt"):
            f = open("log_" + session_id + ".txt")
            response = jsonify( message = f.read() )
            return response, 202
        else:
            return '', 400


@app.route('/api/results/<session_id>', methods = ['GET'])
def download_results(session_id):
    filename = 'log/' + session_id + '.zip'
    if os.path.exists(filename):
        return send_file(filename, 'results.zip', as_attachment=True), 200
    else:
        return '', 400
    # return jsonify( message = "success" ), 200


@app.route('/api/variable/', methods = ['POST'])
def register_variable():
    template_path = '../example/config/' + request.form['session_id'] + '.yaml'
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)

        template['VARIABLES'].append({
            'name': request.form['name'],
            'matchtype': request.form['matchtype'],
            'where': int(request.form['where'])
        })
        with open(template_path, 'w') as stream:
            yaml.dump(template, stream, default_flow_style=False)

        return jsonify( message = "success" ), 200
    else:
        return 404


@app.route('/api/feature/', methods = ['POST'])
def register_feature():
    template_path = '../example/config/' + request.form['session_id'] + '.yaml'
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)

        template['FEATURES'].append({
            'name': request.form['name'],
            'variable': request.form['variable'],
            'matchtype': request.form['matchtype'],
            'value': request.form['value']
        })
        with open(template_path, 'w') as stream:
            yaml.dump(template, stream, default_flow_style=False)

        return jsonify( message = "success" ), 200
    else:
        return 404


@app.route('/api/variables/<session_id>', methods = ['GET'])
def get_variables(session_id):
    template_path = '../example/config/' + str(session_id) + '.yaml'
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)
        
        return jsonify({
            'VARIABLES': template['VARIABLES'] 
        }), 200
    return '', 404


@app.route('/api/features/<session_id>', methods = ['GET'])
def get_features(session_id):
    template_path = '../example/config/' + str(session_id) + '.yaml'
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)
        return jsonify({
            'FEATURES': template['FEATURES'] 
        }), 200
    return '', 404
    

@app.route('/api/feature', methods = ['DELETE'])
def remove_feature():
    template_path = '../example/config/' + request.form['session_id'] + '.yaml'
    filter_list = request.form['names']
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)

        template['FEATURES'] = [d for d in template['FEATURES'] if d['name'] not in filter_list]

        with open(template_path, 'w') as stream:
            yaml.dump(template, stream, default_flow_style=False)

        return jsonify({
            'FEATURES': template['FEATURES'] 
        }), 200
    return '', 404


@app.route('/api/variable', methods = ['DELETE'])
def remove_variable():
    template_path = '../example/config/' + request.form['session_id'] + '.yaml'
    filter_list = request.form['names']
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)

        template['VARIABLES'] = [d for d in template['VARIABLES'] if d['name'] not in filter_list]

        with open(template_path, 'w') as stream:
            yaml.dump(template, stream, default_flow_style=False)

        return jsonify({
            'VARIABLES': template['VARIABLES'] 
        }), 200
    return '', 404

@app.route('/api/config/', methods = ['PUT'])
def change_config_parsing():
    template_path = '../example/config/' + request.form['session_id'] + '.yaml'
    if os.path.exists(template_path):
        with open(template_path, 'r') as stream:
            template = yaml.safe_load(stream)

        if "tag" in request.form:
            template['tag'] = request.form['tag']
        if "timearg" in request.form:
            template['timearg'] = request.form['timearg']
        if "timestamp_format" in request.form:
            template['timestamp_format'] = request.form['timestamp_format']
        with open(template_path, 'w') as stream:
            yaml.dump(template, stream, default_flow_style=False)

        return jsonify( message = "success" ), 200
    else:
        return 404


if __name__ == "__main__":
  app.run()
