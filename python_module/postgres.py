#!/usr/bin/env python3
import psycopg2
import pathlib
from configparser import ConfigParser

conn = None

def configuration(filename='python_db_config.ini', section='postgresql'):
    parser = ConfigParser()
    parser.read(str(pathlib.Path(__file__).parent.absolute()) + '/' + filename)

    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for parameter in params:
            db[parameter[0]] = parameter[1]
    else:
        raise Exception('Section {0} not found in config file {1} file'.format(section, filename))

    return db

def connect():
    try:
        params = configuration()
        conn = psycopg2.connect(**params)
        return conn

    except (Exception, psycopg2.DatabaseError) as err:
        print(err)

def disconnect(conn):
    if conn is not None:
        conn.close()
