  H   �      V   �  z   T   �  ^  T   �  3  T   �  �  T   �  �  T              CLIInfo: SQLstate: "%1S"
                    Return code: "%2S"
                    Diagnostic message: "%3S"
 
db2caem (DB2 Capture Activity Event Monitor data tool)
------------------------------------------------------------------------------
Syntax: db2caem [ -d <database_name> ][ -u <user_id>  -p <password> ]
        [ query-statement-options | event-monitor-options ]
        [ -o <output_path> ][ -h ]

query-statement-options:
  [ -st <query_statement> | -sf <query_statement_file> ]
  [ -compenv <compilation_env_file> ][ -tbspname <table_space_name> ]
  [ -terminator <termination_character> ]

event-monitor-options:
  [ -actevm <event_monitor_name> -appid <application_id> -uowid <uow_id>
    -actid <activity_id> ]

Command parameters:

  -d <database_name>                   Specifies the name of the database which
                                       to be connected to.

  -h                                   Displays help information. When this
                                       option is specified, all other options
                                       are ignored, and only the help
                                       information is displayed.

  -o <output_path>                     The output file(s) of db2caem will be
                                       written to the path that user specifies.

  -p <password>                        Specifies the password for the user ID
                                       when connect to the database.

  -u <user_id>                         Specifies the user ID when connect to
                                       the database.
 
query-statement-options:
  -compenv <compilation_env_file>      Specifies the compilation environment
                                       (comp_env_desc) will be used when the
                                       SQL statement is executed.
                                       The compilation environment is in BLOB
                                       data type and specified through a file.

  -st <query_statement>                Specifies the SQL statement for which
                                       activity event monitor data is being
                                       captured. The SQL statement will be
                                       executed against the database.

  -sf <query_statement_file>           Specifies the file path containing
                                       the SQL statement for which activity
                                       event monitor data is being captured.
                                       Use the -terminator option to specify
                                       the character that marks the end of
                                       the SQL statement. The SQL statement
                                       will be executed against the database.
 
  -tbspname <table_space_name>         Specifies the table space name for which
                                       the activity event monitor will be
                                       created in. In a partitioned database
                                       environment, the table space should
                                       exist on all the database partitions
                                       where the SQL statement of interest
                                       will be run. If not specified, the
                                       default table space will be used when
                                       create the activity event monitor.
 
  -terminator <termination_character>  Specifies the character that indicates
                                       the end of the SQL statement in the -sf
                                       SQL file. The default is a semicolon.

event-monitor-options:
  -actevm <event_monitor_name>         Specifies the name of the existing
                                       activities event monitor containing
                                       the data for the statement of interest.

  -appid <application_id>              Specifies the application identifier
                                       (appl_id monitor element) uniquely
                                       identifying the application that issued
                                       the statement of interest.

  -uowid <uow_id>                      Specifies the unit of work ID
                                       (uow_id monitor element) in which the
                                       statement of interest was executed.

  -actid <activity_id>                 Specifies the activity ID
                                       (activity_id monitor element) of the
                                       statement of interest.
 
      ____________________________________________________________________

                      _____     D B 2 C A E M     _____

                DB2 Capture Activity Event Monitor data tool
                              I      B      M


          The DB2CAEM Tool is a utility for capturing the activity event
         monitor data with details, section and values, as well as actuals.
          which could be used when analyze the SQL statement performance.
      ____________________________________________________________________


________________________________________________________________________________
 