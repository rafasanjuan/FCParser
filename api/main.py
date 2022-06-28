from flask import Flask
from flask import request
from flask import jsonify, json
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.datastructures import  FileStorage
from io import StringIO
import pandas as pd
from pandas_profiling import ProfileReport
import simplejson as py_json


import sys
app = Flask(__name__)
CORS(app)


@app.route('/api/upload', methods = ['POST'])
def upload_file():
    print('Upload_file started')
    uploaded_files = request.files.getlist("files[]")
    if uploaded_files:
        tmp = StringIO(uploaded_files[0].read().decode('utf-8'))
        head = ""
        for i in range(0, 60):
            head += tmp.readline()
        print('Type of head ', type(head))
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
            analysis = py_json.dumps(dict_analysis, ignore_nan=True),
            columns = column_info,
            head = head
        )
    return jsonify(
        status = "error"
    )


if __name__ == "__main__":
  app.run()
