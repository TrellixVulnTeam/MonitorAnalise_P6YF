  �         V      A   V      f   V      �   V        V      R  V      �  V      &  V   	   |  V         V      .  V       T  V   !   �  V   "   �  V   #   %  V   $   ~  V   %   �  V   &     V   '   u  V   (   u  V   )   �  V   *   �  V   +   �	  V   ,      V   -   �  V   .   �  V   /   �  V   0   z  V   1   g  V   2   G  V   3   n  V   4   �  V   5   !  V   6   Y  V   7   �  V   8   �  V   9     V   :   Q  V   ;   u  V   <   �  V   =   T  V   >   x  V   F   �  V   P   �  V   Q   ,  V   R   �  V   S   �  V   d   �  V   e   �  V   �   :  T   �   �   T   �   -  T   �   9  T   �   69  T   �   z9  T   �   �9  T   "%1S": Error: Unable to run the DB2 call out script named "%2S". "%1S": Error: Signal "%2S" received. "%1S": Error: You do not have the authority to run db2fodc. SYSADM authority is required to run db2fodc. "%1S": Error: "%1S" could not get the list of databases. "%1S": Error: "%1S" could not get the list of database partition numbers. "%1S": Error: At least one of the databases specified is not an active database. "%1S": Error: Unable to qualify the provided path "%2S". Ensure the path is valid. (Note: remote execution needs an absolute path) "%1S": Error: Unable to attach to the database manager. Ensure db2start has been run. "%1S": Error: Failed to invoke the DB2 call out script named "%2S" in the directory named "%3S". Check the db2diag.log for details. "%1S": Error: unknown "%2S" suboption: "%3S". "%1S": Error: database name expected. "%1S": Error: an option was expected instead of "%2S". "%1S": Error: It is necessary to specify -hang option at least. "%1S": Error: You cannot specify both of the -db and -alldbs parameters at the same time. "%1S": Error: You cannot specify both of the FULL and BASIC parameters at the same time. "%1S": Error: No database partition number was specified. "%1S": Error: you must specify the name of the directory where db2cos_indexerror scripts are located. "%1S": Error: only one type of problem can be specified in a single db2fodc execution. "%1S": Error: A connection status must be specified with the -connstatus option.  For more information on supported connection statuses, see the DB2 Information Center.  Specify a valid connection status with the db2fodc command, then reissue the command. "%1S": Error: When the -detect parameter is specified, either the basic option or the full option must also be specified.  The option you specify determines how much data is collected, if diagnostic data collection is triggered.  Specify the basic or the full option, then reissue the command. "%1S": Error: At least one valid threshold rule must be specified with the -detect parameter.  For more information on supported threshold options, see the DB2 Information Center.  Specify a supported threshold option, then reissue the db2fodc -detect command. "%1S": Error: The -detect and -hangdetect parameters cannot be specified together.  You can detect either a hang or a specific threshold condition with a single FODC invocation, but not both.  Specify only one of these parameters, then reissue the command. "%1S": Error: The -nocollect option must be specified together with either the -hangdetect parameter or the -detect parameter.  The -nocollect option prevents the detection of a hang or of a specific threshold condition from triggering diagnostic data collection.  Specify the -hangdetect parameter or the -detect parameter, then reissue the command. "%1S": Error: Only a single database can be specified together with the -detect parameter.  Multiple databases are not supported. Specify only a single database, then reissue the command. "%1S": Error: An invalid connection status was specified for the connstatus option.  For more information on supported connection status names, see the DB2 Information Center.  Specify a valid connection status name with the db2fodc command, then reissue the command "%1S": Error: An option can be specified only once.  The db2fodc -detect parameter supports a number of options you can specify.  Each option can be specified only once.  Verify that each option you specify is included only once, then reissue the command. "%1S": An invalid value was specified.  Only positive integers can be specified as values.  Modify the db2fodc -detect command to include a valid value, then reissue the command. "%1S": Error: An unsupported threshold suboption was specified.  For more information on supported threshold suboptions, see the DB2 Information Center.  Specify a supported threshold suboption, then reissue the db2fodc -detect command. "%1S": Error: The -member,-dbpartitionnum and -alldbp parameters cannot be specified together with the -clp parameter. Specify the command without the -member, -dbpartitionnum or -alldbp parameter, then reissue the command. "%1S": List of active databases: "%2S" "%1S": List of active database partition numbers: "%2S". "%1S": The database named "%2S" is active. To run db2fodc -indexerror in the FULL mode, the database must be deactivated. "%1S": Invoking the DB2 call out script named "%2S" ... "%1S": The DB2 call out script named "%2S" was invoked successfully. "%1S": Collect the db2dart reports that are specified in the DB2 call out script named "%2S". "%1S": Starting detection ... "%1S": "%2S" consecutive thresholds hits are detected. "%1S": Triggering collection "%2S". "%1S": Detection is completed.
           Total number of detections : "%2S"
           Total number of collections: "%3S" "%1S": "%2S" minute(s) duration is reached, stopping detection. Total number of collections: "%3S". "%1S": No thresholds hits detected. "%1S": Stopping all FODC detections. Note that it can take up to 60 seconds to stop all detections. "%1S": Error: The -db and -alldbs parameters cannot be specified with the -clp.  Specify the command without the -db or -alldbs parameter, then reissue the command. 
**************************DB2FODC WARNING*****************************
*  You need to ensure that the db2dart report files specified in     *
*  the db2cos_indexerror_short and db2cos_indexerror_long scripts    *
*  do not exist already. Otherwise the new report files will not     *
*  be generated during the run. Waiting for 15 seconds ...           *
********************************************************************** "%1S": Important: some data may not be collected. To collect complete information please run script db2cos_clp with root authority. "%1S": Important: When the -fodcpath parameter is specified with the db2fodc command, the db2support command will not be able to determine the location of the FODC package. For the db2support command to include the FODC package, you must specify the FODC path with the -fodcpath parameter when the db2support command is issued. "%1S": The directory "%2S" does not exist or you don't have the authority to access it. Ensure that the directory you specify exists and is accessible, then rerun the command FODC package has been successfully collected in directory "%1S". Open the file named "%1S" in that directory for details about the collected data. 
db2fodc (DB2 First Occurrence Data Capture) collects data for problem
determination for hangs, performance problems and various types of errors.
Specify the type of outage or error detected, and optionally the mode that
you want to execute (FULL or BASIC). Additionally for some options, you can
specify the databases, the database partition numbers, the member or the host
that you suspect affected, as suboption(s).


Usage: db2fodc [[[-hang | -perf | -cpu | -memory | -connections ] [full | basic]
                 [-db <database_name> | -alldbs]
       [-dbpartitionnum <dbpartition_nums> | -alldbpartitionnums
          | -member <member_nums> | -host <host_list>]
       [-timeout <timeout_period>]
       [-fodcpath <path_name>]] |
       [-indexerror <script_directory> [full | basic]
       [-dbpartitionnum <dbpartition_num> | -member <member_num>]
       [-timeout <timeout_period>]
       [-fodcpath <path_name>]] |
       [ -clp ]
       [ -preupgrade ]
       [ -hadr ]
       [[ -detect ] [connstatus=<status*>] [condition=<value>]
                    [iteration=<value>] [duration=<value>]
                    [sleeptime=<value>] [interval=<value>]
                    [triggercount=<value>] [off]]
       status: [ConnectPending | ConnectCompleted | UOW-Executing | UOW-Waiting
               | Lock-wait | CommitActive | RollbackActive | Recompiling
               | Compiling | RequestInterrupted | DisconnectPending
               | TransactionPrepared | HeuristicallyCommitted
               | HeuristicallyAborted | TransactionEnded | CreatingDatabase
               | RestartingDatabase | RestoringDatabase | PerformingBackup
               | PerformingLoad | PerformingUnload | WaitToDisableTablespace
               | QuiescingTablespace | PendingRemoteRequest
               | FederatedRequestPending | Decoupled | RollbackToSavepoint
               | Wait-Autonomous | UOWQueued| Unknown]
 


db2fodc options (with mode):
  -hang [full | basic]
  -perf [full | basic]
  -cpu [full | basic]
  -memory [full | basic]
  -connections [full | basic]
  -indexerror <script_directory> [full | basic]
  -clp
  -preupgrade
  -hadr
  -help

db2fodc suboptions:
  -db <database_names>
  -alldbs
  -dbpartitionnum <dbpartition_nums>
  -alldbpartitionnums
  -timeout <timeout_period>
  -fodcpath <path_name>
  -member <member_nums>
  -host <host_list>
  -detect

Description of db2fodc options:
  -hang:
    Used if the system appears to be hung. If mode (FULL or BASIC) is not
    specified, you will be asked after BASIC collection.
  -perf:
    Used if the system is performing slower than expected or having any kind
    of performance issues. BASIC mode will have a contained performance impact
    on the system while FULL can be more intrusive, but will collect more data.
    BASIC mode is run if none is specified.
  -cpu:
    If you observe unusually high processor utilization rates, a high number of
    running processes or high processor wait times, then you can use the
    db2fodc -cpu command to collect processor-related performance and
    diagnostic data.
  -memory:
    If you determine that there is no free memory available, that swap space is
    being used at a high rate, that excessive paging is occurring, or if you
    suspect a memory leak, then you can use the db2fodc -memory command to
    collect memory-related diagnostic data.
  -connections:
    If you determine that there is a spike in the number of applications in the
    executing or compiling state, or that new database connections are being
    denied, then you can use the db2fodc -connections command to collect
    connection-related diagnostic data.
  -indexerror:
    Used in the following situations: if the system encountered index errors;
    and if db2cos_indexerror_short or db2cos_indexerror_long scripts are
    dumped. The BASIC mode will invoke db2cos_indexerror_short script,
    and the FULL mode will invoke both db2cos_indexerror_short and
    db2cos_indexerror_long scripts. If the mode (FULL or BASIC) is not
    specified, the BASIC mode is the default. The db2cos_indexerror_long
    script might contain db2dart commands that could take a substantial
    amount of time to complete; and might contain the db2dart /t command
    which must be run against an offline database.
  -clp:
    If you encounter problems related to instance creation (as indicated by the
    DBI1281E error message, for example) use the db2fodc -clp command to collect
    related diagnostic data. This option is not supported on windows systems.
  -preupgrade:
    The db2fodc -preupgrade command is used before the DB2 instance is upgraded
    to a newer software version. The db2fodc -preupgrade command collects
    diagnostic and performance data about the current system and makes future,
    post-upgrade troubleshooting easier. You must run the db2support -preupgrade
    command afterwards to collect the diagnostic data obtained into a compressed
    archive file.
  -hadr:
    This option collects data for diagnosing HADR problems.
  -help:
    Prints this help.
 
Description of db2fodc suboptions:
  The suboption should be used with the applicable options together.
  -db:
    Input the name of the databases affected by the outage or error.
    Format example: -db sample,dbname1,dbname2
  -alldbs:
    Indicates all active databases will be used for the data collection.
    This is default for the applicable options.
  -dbpartitionnum <dbpartition_nums>:
    Collects FODC data related to all the specified database partition numbers.
    Format example: -dbpartitionnum 1,2,3
  -alldbpartitionnums:
    Indicates to run the command on all active database partition servers in
    the instance. db2fodc will report information from database partition
    servers on the same physical machine that db2fodc is being run on.
  -timeout <timeout_period>:
    Specifies a timeout period for the call-out script. If the timeout period
    has been reached before the call-out script has finished executing, the
    call-out script process will be killed. The default timeout period is
    unlimited. The timeout option takes the form nh ym xs, where n, y, and x are
    numbers, and h, m, and s represent hours, minutes, and seconds respectively.
    If no suffix is specified the number will be considered in seconds.
    Format example: -timeout 2h 30m 45s
                    -timeout 2m 30s
                    -timeout 600
  -fodcpath <path_name>:
    Specify an existing path name to redirect all of the db2fodc contents in
    which the entire fodc package will get created at this path. This path can
    also be collected by db2support tool using the same suboption and the same
    path name.
    Example: -fodcpath /home/myFODCPackages/
  -member <member_nums|all>:
    Specifies the member or members on which this command is issued. If this
    option is not specified, the command is issued on the current member.
    Multiple members can be specified as a comma-separated list, using a range,
    or as a combination of these two methods. The keyword 'all' will issue the
    command on all members in db2nodes.cfg. The -member option cannot be
    combined with the -host option.
    Format example: -member 2
                    -member 2,3
                    -member 2-5
                    -member 0,2-5
                    -member all
  -host <host_list>:
    Specifies the host or hosts on which this command is issued. The command
    is issued on all the members of the host(s) specified. All hosts given must
    be valid for the command to complete.
    Format example: -host mylocalhost
                    -host host1,host2,host3
  -detect:
    The db2fodc -detect command is used to detect specific problem conditions
    based on thresholds you specify and can trigger diagnostic data collection.
    Detection is performed at regular intervals, as specified by the interval
    option.  If the number of consecutive threshold condition hits is equal to
    or greater than the value specified in by the triggercount option, then
    diagnostic data collection is triggered.

Example: db2fodc -hang
 db2fodc: Warning: HADR is not active db2fodc: Error: -hadr option doesn't support -dbp or -member option db2fodc: Error: -db option has to be specified with -hadr option db2fodc: Error: -hadr option is not supported in partitioned database
environment ( DPF ). 