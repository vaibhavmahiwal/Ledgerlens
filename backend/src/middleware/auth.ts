import {Request,Response,NextFunction} from "express";
import jwt from "jsonwebtoken";
import {config} from "../config";
import { createChildLogger } from "../lib/logger";
import { UnauthorizedError, ForbiddenError } from "../lib/errors"

//extended express to include agent
declare global{
    namespace Express{
        interface Request{
            agent:{
                id:string;
                email:string;
                role:"dsa"|"admin";
            }
        }
    }
}

interface JWTPayload{
    agentId:string;
    email:string;
    role:"dsa"|"admin";
    iat:number;
    exp:number;
}


//main auth middleware
export const authenticate=(
    req:Request,
    res:Response,
    next:NextFunction)=>{
      const log=createChildLogger(req.correlationId)
      
      const authHeader=req.headers.authorization;
      if(!authHeader||!authHeader.startsWith("Bearer")){
        return next(new UnauthorizedError("No token provided"))
      }

      const token=authHeader.split(" ")[1];
      if(!token){
        return next(new UnauthorizedError("No token provided"))
      }
    
      try{
        const  payload=jwt.verify(token,config.JWT_SECRET)as JWTPayload;
        req.agent={
            id: decoded.agentId,
            email: decoded.email,
            role: decoded.role,
        }

        log.debug({agentId:decoded.agentId,role:decoded.role},"Aget authenticated")
        next();
      }catch(err){
       if (err instanceof jwt.TokenExpiredError) {
          return next(new UnauthorizedError("Token expired"))
       }
       if (err instanceof jwt.JsonWebTokenError) {
          return next(new UnauthorizedError("Invalid token"))
       }
       next(err)
      }
    }

export const requireRole = (...roles: Array<"dsa" | "admin">) =>{
   return (req:Request,res:Response,nest:NextFunction)=>{
      if(!req.agent){
        return next(new UnauthorizedError("Not authenticated"))
      }
      if(!roles.includes(req.agent.role)){
        return next(new ForbiddenError("Insufficient permissions"))
      }

      if(!roles.includes(req.agent.role)){
        return next(
        new ForbiddenError(
               `Access denied. Required role: ${roles.join(" or ")}`
        )
        )
      }
      next()
   }
}

export const generateToken = (agent: {
  id: string
  email: string
  role: "agent" | "admin"
}): string => {
  return jwt.sign(
    {
      agentId: agent.id,
      email: agent.email,
      role: agent.role,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  )
}