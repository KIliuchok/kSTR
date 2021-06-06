# Media-Streaming-Platform-From-Local-Storage

The overall goal of this project is to build a Web Application that would allow user to stream owned and locally stored video files to another devices over the Internet.

Please bear in mind that this is being actively developed and might not be very refined.

Application from this template is running at https://kiliuchok.club

Currently uses external python scripts for the DB Access, and checking for the file changes in the library folder. (Not efficient)

Before the server is run, 2 configuration files are required to be setup, templates of which are provided. Please insert the proper data and remove the .template extension.

Requires Python3+ along with additional library, such as psycopg2. Not provided by default and required to be installed for your Python environment (with Pip for example). password_hash.py currently not used, but could be used later to hash the passwords of the users before storing them in DB and during login phase.

 **Requires Postgres Server Running with following table schema:** 

Table "videos" containing columns: id Integer, name Varchar(128), season Integer, episode Integer, show Varchar(128), where id is Primary Key and show references show_names(name)

Table "show_names" containing columns: dir_name Varchar(128), name Varchar(128), season Integer, year Integer, where name is Primary Key.

*Connection and DB names are configured in python_db_config.ini. The postgres config inside main config.js is currently not utilized.*

The Movie DB integration retrieves the show details in case it finds a match.

Future Milestones:
 - Migrate the DB interactions to be coded directly in nodejs (Remove dependancy on Python)
 - User Management System
 - Transcoding tweaks + ability to choose the desired resolution(s)

Longer-term Milestones:
 - Client-Only server for streaming the content, but which does not host the actual website
 - Mobile Application
 - On the fly transcoding
