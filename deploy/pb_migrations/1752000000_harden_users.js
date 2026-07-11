/// <reference path="../pb_data/types.d.ts" />
/* Durcissement de la collection « users » : le tracker n'utilise QUE la
   connexion Google. Sans ce durcissement, PocketBase laisse par défaut :
   - l'inscription directe par email/mot de passe ouverte à tous
     (createRule = "" → n'importe qui peut créer des comptes → spam de la base) ;
   - l'authentification par mot de passe activée.

   On restreint donc la création aux seuls comptes issus du flux OAuth2
   (@request.context = "oauth2", évalué côté serveur — une requête d'inscription
   directe est en contexte "default" et reçoit 400) et on désactive le login
   par mot de passe. Le flux OAuth2 continue de créer les nouveaux comptes :
   sa requête interne porte le contexte "oauth2", donc la règle est satisfaite.

   Auto-hébergeur qui voudrait au contraire l'inscription par mot de passe :
   remettre createRule = "" et passwordAuth.enabled = true. */
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = '@request.context = "oauth2"';
  users.passwordAuth.enabled = false;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  users.passwordAuth.enabled = true;
  app.save(users);
});
