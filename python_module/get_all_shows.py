#!/urs/bin/env python3
import postgres
import os
import json

def get_list_of_shows():
    cur = conn.cursor()
    sql_q = 'SELECT name FROM show_names ORDER BY name ASC'
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
    list_of_shows = get_list_of_shows()
    for item in list_of_shows:
        output_string += item
        output_string += ","
    
    print(output_string)
    postgres.disconnect(conn)
