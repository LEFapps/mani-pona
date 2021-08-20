Because Jest breaks console.log (yes), many logging frameworks won't work as expected either.
The purpose here is to have a unified logging system for the server-side, that also works as expected during Jest testing.
 
All of the logging settings are controlled with ENV variables, to be compatible with util.debuglog (which does work).
This means it requires a restart to change and also that you can't disable "parts of the logging" throughout the code,
which is bad practice anyway.
 
To activate, set the following ENV variable:

## NODE_DEBUG
This is standard util.debuglog config. E.g. all debug statements from <my_app>:<subsystem>
`NODE_DEBUG=<my_app>:<subsystem>:debug`
or
`NODE_DEBUG=<my_app>:*` (for all subsystems)

Be careful, if you do `NODE_DEBUG=*`, you'll pick up debug statements from all kinds of packages.
 
Usage, not that util.debuglog has printf-like functionality.

```
import { getLogger } from 'server-log'
const log = getLogger('subsystem')
log.trace('something happened %j',someJsonObj)
```
