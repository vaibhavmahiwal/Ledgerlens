import pino from "pino";
import {config} from "../config"


export const logger=pino({
    transport:
     config.NODE_ENV==="development"
     ?{
        target:"pino-pretty",
        options:{
             colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
        },
     }
     :undefined,

    //minimum log level to output

    level: config.NODE_ENV === "development" ? "debug" : "info",
    //this field will appear in vevery log ling automatically
    base:{
        service:"ledgerlens",
        env: config.NODE_ENV,
    },
})

//child logger with a correlation id attached
//// Use this inside request handlers and workers
// Every log line from this child will include the correlationId
export const createChildLogger=(correlationId:string,context?:Record<string,unknown>)=>{
    return logger.child({
        correlationId,
        ...context,
    })
}

