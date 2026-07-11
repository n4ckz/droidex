/// <reference path="../pb_data/types.d.ts" />
/* Collection « saves » : une sauvegarde de registre par utilisateur,
   lisible et modifiable uniquement par son propriétaire.
   Schéma validé contre PocketBase 0.39.6. */
migrate((app) => {
  app.importCollectionsByMarshaledJSON(JSON.stringify([
{
  "listRule": "user = @request.auth.id",
  "viewRule": "user = @request.auth.id",
  "createRule": "user = @request.auth.id",
  "updateRule": "user = @request.auth.id",
  "deleteRule": "user = @request.auth.id",
  "name": "saves",
  "type": "base",
  "fields": [
    {
      "autogeneratePattern": "[a-z0-9]{15}",
      "help": "",
      "hidden": false,
      "id": "text3208210256",
      "max": 15,
      "min": 15,
      "name": "id",
      "pattern": "^[a-z0-9]+$",
      "presentable": false,
      "primaryKey": true,
      "required": true,
      "system": true,
      "type": "text"
    },
    {
      "cascadeDelete": true,
      "collectionId": "_pb_users_auth_",
      "help": "",
      "hidden": false,
      "id": "relation2375276105",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "user",
      "presentable": false,
      "required": true,
      "system": false,
      "type": "relation"
    },
    {
      "help": "",
      "hidden": false,
      "id": "json2918445923",
      "maxSize": 2000000,
      "name": "data",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "json"
    },
    {
      "hidden": false,
      "id": "autodate2990389176",
      "name": "created",
      "onCreate": true,
      "onUpdate": false,
      "presentable": false,
      "system": false,
      "type": "autodate"
    },
    {
      "hidden": false,
      "id": "autodate3332085495",
      "name": "updated",
      "onCreate": true,
      "onUpdate": true,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_saves_user ON saves (user)"
  ],
  "system": false
}
  ]), false);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("saves"));
});
