FROM mariadb:10.4

# load the database from MySQL dump
ADD ./dumps/mensabot_dump_2021-04-06.sql /docker-entrypoint-initdb.d

