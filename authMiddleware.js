function authMiddleware(req,res,next){
const username = req.cookies["session-user"];
if(!username){
    return res.status(401).json({success:false,message:"Unauthorised"});
}
req.username = username;
next();

}

module.exports = authMiddleware;