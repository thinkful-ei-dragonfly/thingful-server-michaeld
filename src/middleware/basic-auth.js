const knex = require('knex');

function requireAuth(req,res,next) {
 
  const authToken = req.get('Authorization') || '';

  if(!authToken.toLowerCase().startsWith('basic ')){
    return res.status(401).json({error: 'Missing token'});
  } 

  const [_, token] = authToken.split(' ');

  const [user_name, password] = Buffer
    .from(token, 'base64')
    .toString()
    .split(':');


  if (!user_name || !password) {
    return res.status(401).json({error: 'Unauthorized request'});
  }

  req.app.get('db')('thingful_users')
    .where({user_name})
    .first()
    .then(user =>{
      if(!user || user.password !== password){
        return res.status(401).json({error:'Unauthorized request'});
      }
      req.user = user;
      next();
    })
    .catch(next);

}

module.exports = {
  requireAuth,
}