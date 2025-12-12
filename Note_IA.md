**Outils IA utilisés :** 
* Claude Sonnet 4.5 + ChatGPT sur l’outil Copilot intégré à VS Code.

**Quelques prompts utilisées :**

* "Je n'arrive pas à lancer mon projet correctement. Le serveur backend semble démarrer, mais il n'y a pas de communication avec le frontend ou j'obtiens des erreurs de connexion."

* "Peux-tu analyser ces logs Prisma du backend ? Je vois des connexions Socket.IO et des requêtes SQL, mais je ne comprends pas pourquoi un seul étudiant s'affiche alors que deux se sont connectés."

* "Pourquoi TanStack Query ne rafraîchit pas automatiquement la liste des participants quand un nouvel étudiant rejoint la session ?"

* "J'ai un bug bizarre : quand le premier étudiant valide sa réponse, le bouton indique 'réponse enregistrée' mais ça ne passe pas à la prochaine question. Et si le deuxième étudiant essaie de répondre, il reçoit un message disant que la réponse a déjà été envoyée. On dirait que ça ne peut gérer qu'un seul étudiant à la fois."

* "Quelle est la différence entre socket.emit() et socket.to().emit() ?"

* "J'ai extrait les tokens JWT de mes deux comptes étudiants (John DOE et Loris NEVE) et ils semblent identiques. Peux-tu les décoder pour voir si c'est normal ou s'il y a un problème ?"

* "Comment Prisma gère-t-il les contraintes unique comme sessionId_userId et que se passe-t-il si on essaie d'insérer un doublon ?"

* "Attends, je suis sûr d'avoir créé deux comptes différents avec des emails différents (johndoe@gmail.com et lorisneve@gmail.com). Si leurs tokens contiennent le même userId, ça voudrait dire qu'il y a un bug dans la création des comptes étudiants, non ?"


