import postgres
import os
import subprocess
import pathlib
from configparser import ConfigParser

config = ConfigParser()


config.read(str(pathlib.Path(__file__).parent.absolute()) + '/python_db_config.ini')
shows_directory = config.get('directories', 'shows_dir')
image_directory = config.get('directories', 'images_dir')

# Please point to ffmpeg installation in the config before launching Web Server
ffmpeg_location = config.get('directories', 'ffmpeg_location')

def find_files_and_dirs():
    dirs = []
    files = []
    for (dirpath, dirnames, filenames) in os.walk(shows_directory):
        files.extend(filenames)
        dirs.extend(dirnames)
        break
    return dirs, files

def find_files_in_dir(folder_name):
    files = []
    for (dirpath, dirnames, filenames) in os.walk(shows_directory + "/" + folder_name):
        files.extend(filenames)
        break
    add_to_remove = None
    for file in files:
        if ".DS_Store" in file:
            add_to_remove = ".DS_Store"
    if add_to_remove is not None:
        files.remove(add_to_remove)
    return files

def check_if_entry_already(folder_name):
    cur = conn.cursor()
    sql = 'SELECT dir_name FROM show_names'
    list_of_shows = []

    cur.execute(sql)
    list_of_shows = cur.fetchall()

    print(list(list_of_shows))

    for item in list(list_of_shows):
        if folder_name in list(item):
            print("{0} is in DB already".format(folder_name))
            cur.close()
            return


    sql_insert = "INSERT INTO show_names(dir_name, name) VALUES ('" + folder_name + "', '" + folder_name + "')"
    cur.execute(sql_insert)
    conn.commit()
    cur.close()
    print("Added %s to DB", folder_name)


def parse_and_add_files(folder_name):
    cur = conn.cursor()
    sql = "SELECT * FROM videos WHERE show = '{0}'".format(folder_name)
    list_of_episodes = []

    cur.execute(sql)
    list_of_episodes = cur.fetchall()

    list_of_files_in_dir = find_files_in_dir(folder_name)
    print(list_of_files_in_dir)
    to_remove = []

    for file in list_of_files_in_dir:
        for item in list(list_of_episodes):
            if file in list(item):
                print("{0} episode is in DB already".format(file))
                to_remove.append(file)

    if len(to_remove) != 0:
        for item in to_remove:
            list_of_files_in_dir.remove(item)


    if len(list_of_files_in_dir) != 0:
        for file in list_of_files_in_dir:
            sql = "INSERT INTO videos(name, show) VALUES ('{0}', '{1}')".format(file, folder_name)
            cur.execute(sql)
            conn.commit()
            print("Added {0} to DB".format(file))

    cur.close()


def if_image_folder_exists(directory):
    dirs_image = []
    for (dirpath, dirnames, filenames) in os.walk(image_directory):
        dirs_image.extend(dirnames)

    if directory not in dirs_image:
        path = image_directory + "/" + directory
        os.mkdir(path)
        return


# Conversion is done currently if the file format is not in mp4 format without regards to codecs (for now)
def find_files_for_conversion(directory):

    conversion_required = []

    _, _, filenames = next(os.walk(shows_directory + "/" + directory))

    for file in filenames:
        filename, file_extension = os.path.splitext(shows_directory + "/" + directory + "/" + file)
        print("Found, ", filename, file_extension)
        if (file_extension != ".mp4" and ".DS_Store" not in filename):
            conversion_required.append(shows_directory + "/" + directory + "/" + file)
    return conversion_required

def convert_files(files, directory):
    for file in files:
        filename, _ = os.path.splitext(shows_directory + "/" + directory + "/" + file)
        finales = filename.split('/')
        filename = finales[len(finales) - 1]
        new_path = shows_directory + "/" + directory + "/" + filename
        
        process = subprocess.run(ffmpeg_location + ' -i "' 
        + file + '" -c:a copy -c:v libx264 "' + new_path + '".mp4', shell=True, check=True, stdout=subprocess.PIPE, universal_newlines=True)

    for file in files:
        os.remove(file)
        print("Removed all original files that were converted")



if __name__ == '__main__':
    conn = postgres.connect()

    dirs, files = find_files_and_dirs()
    print(dirs, files)

    for item in dirs:
        print("Attempting conversion")
        to_convert = find_files_for_conversion(item)
        if to_convert is not None:
            print("To Convert: ")
            print(to_convert)
            convert_files(to_convert, item)
            print("Conversion finished")
    dirs, files = find_files_and_dirs()

    # Check if any folders are not in db
    for item in dirs:
        check_if_entry_already(item)
        parse_and_add_files(item)
        if_image_folder_exists(item)


    postgres.disconnect(conn)