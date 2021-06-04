#!/urs/bin/env python3
import postgres
import sys
import json

def get_list_of_eps():
    cur = conn.cursor()
    sql_q = "SELECT name FROM videos WHERE show='{0}' ORDER BY name ASC".format(sys.argv[1])
    list_of_shows = []

    cur.execute(sql_q)
    list_of_shows = cur.fetchall()

    output = []

    for item in list(list_of_shows):
        output.append(item[0])
    
    cur.close()
    return output

if __name__ == '__main__':
    conn = postgres.connect()

    output_string = ""
    list_of_shows = get_list_of_eps()
    for item in list_of_shows:
        output_string += item
        output_string += ","
    
    print(output_string)
    postgres.disconnect(conn)
