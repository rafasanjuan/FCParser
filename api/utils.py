
import os
import sys
import inspect
import time
import calendar
from zipfile import ZipFile
import yaml

def run_parser(session_id):
    if session_id:
        sys.stdout = open('log_' + session_id +'.txt', 'w')
        currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
        parentdir = os.path.dirname(currentdir)
        # print('os dir: ' + os.getcwd())
        # print('currendir: ' + currentdir)
        # print('parentdir: ' + parentdir)
        sys.path.insert(0, parentdir)
        sys.path.append(os.getcwd().replace('api', 'bin'))
        # sys.path.append(os.getcwd() + '/api')
        if os.path.exists(parentdir + '/api/log/' + session_id + '.zip'):
            os.remove(parentdir + '/api/log/' + session_id + '.zip')
        import fcparser
        config_path = parentdir + '/example/config/configuration.yaml'
        os.chdir(parentdir)
        generate_config_file(session_id)
        fcparser.main(call='internal', configfile=config_path)
        zip_results(session_id, parentdir)

def zip_results(session_id, parentdir):
    filename = 'api/log/' + session_id + '.zip'
    path = parentdir + '/example/parsing_output'
    list_files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
    with ZipFile(filename, mode='w') as zf:
        for f in list_files:
            zf.write(path + '/' + f, f)


def generate_session_id():
    return calendar.timegm(time.gmtime())

def generate_config_file(session_id):
    config = {
        'DataSources': {
            'api_call': {
                'config': './example/config/' + str(session_id) + '.yaml',
                'parsing': './example/Examples_data/' + str(session_id) + '.csv'
            }
        }, 
        'Online': False,
        'Incremental_Output': False,
        'Processes': 4,
        'Max_chunk': 100,
        'Lperc': 0.01,
        'Endlperc': 0.0001,
        'Keys': None,
        'Parsing_Output': {
            'dir': './example/parsing_output',
            'stats': 'stats.log'
        },
        'SPLIT': {
            'Time': {
                'window': 1
            }
        }
    }
    with open('example/config/configuration.yaml', 'w') as fd:
        yaml.dump(config, fd, default_flow_style=False)


def generate_template_file(session_id):
    template = {
        'tag': 'netflow',
        'structured': True,
        'timestamp_format': "%Y-%m-%d %H:%M:%S",
        'timearg': 'timestamp',
        'VARIABLES': [],
        'FEATURES': []
    }
    with open('../example/config/' + str(session_id) + '.yaml', 'w') as fd:
        yaml.dump(template, fd, default_flow_style=False)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_parser(sys.argv[1])
