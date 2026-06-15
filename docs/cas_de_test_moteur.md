# Cas de test — Moteur de matching (`engine.js`)

> Scénarios d'entrée → comportement attendu, pour valider le moteur **sans attendre l'UI**.
> Base de référence : `recettes_50.json` (ou `recettes_poc.json` pour les tests sur petite base).
> Format : Contexte (état) → Action → Attendu.

---

## Convention de tags (important)

- `vegetarien`, `enfant_friendly` : décrivent le plat.
- `porc` : **le plat contient du porc** (lardons, jambon, saucisses, chipolatas, côte de porc…).
  L'exclusion utilisateur « porc » retire les plats **portant** ce tag. (Principe général : une
  exclusion alimentaire correspond à un tag de *contenu* présent sur le plat.)
- `equipement_requis` : `[]`, `["four"]` ou `["airfryer"]` — filtré selon l'équipement possédé.

---

## A. Filtres durs (jamais relâchés)

**A1 — Équipement manquant**
- Contexte : `equipements = { four:true, airfryer:false }`.
- Action : générer une proposition (mode Surprends-moi).
- Attendu : aucun plat `equipement_requis:["airfryer"]` (nuggets airfryer, colin airfryer, falafel
  airfryer, etc.) n'est jamais proposé, quel que soit le nombre de « Autre chose ».

**A2 — Préférence végétarienne**
- Contexte : `preferences.vegetarien = true`.
- Action : enchaîner 15 « Autre chose ».
- Attendu : **uniquement** des plats portant le tag `vegetarien`. Aucun plat volaille/poisson/viande,
  même quand le moteur relâche les malus soft (le filtre dur n'est jamais relâché).

**A3 — Exclusion porc**
- Contexte : `preferences.exclusions = ["porc"]`.
- Action : parcourir toutes les propositions possibles.
- Attendu : carbonara, croque-jambon, riz cantonais, saucisses, côtes de porc, chipolatas (tous tagués
  `porc`) ne sont **jamais** proposés.

**A4 — Cumul de filtres**
- Contexte : `vegetarien=true`, `equipements.airfryer=false`.
- Attendu : ni plat non-végé, ni plat airfryer. Intersection correcte (ex. galettes de pois chiches
  airfryer exclues car airfryer, même si végé).

---

## B. Réalisabilité & garde-manger

**B1 — Surprends-moi, placard standard**
- Contexte : garde-manger complet (tous les basiques), `frais_du_jour = []`, aucun historique.
- Action : ouvrir l'app.
- Attendu : un plat s'affiche immédiatement. Priorité aux plats 100 % placard (`ingredient_vedette:null`
  — ex. pâtes-thon-tomate, riz-thon-maïs, soupe tomate-vermicelles) ou à ≤ 1 frais manquant signalé.

**B2 — Basique retiré du placard**
- Contexte : l'utilisateur a retiré « tomates concassées ».
- Attendu : un plat qui en dépend (pâtes-thon-tomate, dahl, soupe tomate) n'est pas « pleinement
  réalisable » ; s'il est proposé via appoint, l'ingrédient manquant est **signalé** (« il te manque
  peut-être : tomates concassées »).

**B3 — Frais coché**
- Contexte : `frais_du_jour = ["champignons"]`.
- Attendu : les plats utilisant les champignons (omelette-champignons, poulet crème & champignons)
  remontent en tête (bonus frais coché). Le plat proposé doit en priorité utiliser ce frais.

**B4 — Frais coché sans plat correspondant**
- Contexte : `frais_du_jour = ["betterave"]` (aucun plat ne l'utilise).
- Attendu : **pas d'écran vide**. Message « aucune idée avec betterave ce soir » + proposition de repli
  (Surprends-moi).

---

## C. Récence (decay) — le point sensible

**C1 — Un plat cuisiné ne ressort pas le soir même**
- Contexte : omelette-champignons validée aujourd'hui.
- Action : ouvrir l'app le même soir, enchaîner quelques « Autre chose ».
- Attendu : omelette-champignons fortement défavorisée (n'apparaît pas en premier ; idéalement pas du
  tout tant que d'autres candidats existent).

**C2 — Le plat revient après le decay (PAS de sac mélangé)**
- Contexte : omelette-champignons validée il y a 6 jours, peu d'autres plats joués.
- Attendu : son malus de récence est ~nul ; elle est de nouveau un candidat normal. **Critère clé :** un
  favori doit pouvoir revenir sans qu'on ait épuysé toute la base. Vérifier qu'avec seulement 3-4 plats
  cuisinés dans la semaine, des plats récents redeviennent éligibles (le moteur ne force pas à voir les
  50 avant de répéter).

**C3 — Petite base, anti-écran-vide**
- Contexte : `recettes_poc.json` (10 plats), 8 plats déjà vus/validés cette semaine.
- Action : « Autre chose » plusieurs fois.
- Attendu : toujours une proposition (relâchement progressif : appoint → diversité → récence). Jamais
  d'écran vide.

---

## D. Diversité de catégorie

**D1 — Éviter la même catégorie deux soirs de suite**
- Contexte : hier = volaille (poulet-poêlé), avant-hier = volaille (teriyaki).
- Attendu : aujourd'hui, la catégorie `volaille` est légèrement pénalisée ; le 1er proposé est plutôt
  d'une autre catégorie (féculent, œufs, poisson…). La volaille n'est pas bannie, juste retardée.

**D2 — La diversité cède au manque de choix**
- Contexte : végé activé + équipement réduit → peu de catégories disponibles.
- Attendu : le malus diversité se relâche avant de produire un écran vide (ordre §10.5).

---

## E. Préférence apprise (👍 / 👎)

**E1 — 👎 retire le plat des propositions courantes**
- Contexte : steak-haché noté 👎.
- Action : générer des dizaines de propositions sur plusieurs jours.
- Attendu : steak-haché tombe tout en bas ; il n'apparaît qu'en **dernier recours** (relâchement ultime,
  après la récence), pas dans le flux normal. Il n'est pas supprimé de la base.

**E2 — 👍 favorise durablement**
- Contexte : poulet-curry-coco noté 👍.
- Attendu : à conditions égales (réalisable, pas récent), il est proposé plus souvent que la moyenne.
  L'effet est **durable** (ne s'efface pas avec le temps, contrairement à la récence).

**E3 — Indépendance récence / appréciation**
- Contexte : un plat 👍 cuisiné hier.
- Attendu : malgré le 👍, il reste défavorisé **ce soir** (récence). Le 👍 ne court-circuite pas
  l'espacement à court terme ; il agit sur le long terme.

---

## F. « Autre chose » & session

**F1 — Pas de répétition dans la session**
- Action : « Autre chose » 5 fois de suite.
- Attendu : 5 plats distincts (tant que le stock le permet), aucun ne se répète dans la même session.

**F2 — Interstitiel pub cadencé**
- Action : « Autre chose » de façon répétée.
- Attendu : un interstitiel se déclenche après plusieurs occurrences (ex. tous les 4-5), **jamais** au
  1er affichage ni pendant l'ouverture du détail / du mode cuisine.

---

## G. Validation & persistance

**G1 — « Je cuisine ça » écrit l'historique**
- Action : depuis le détail, « Je cuisine ça ».
- Attendu : `historique[id].validation` = horodatage courant ; le mode cuisine s'ouvre.

**G2 — 👍/👎 écrit l'appréciation**
- Action : à la fin du mode cuisine, taper 👍.
- Attendu : `historique[id].appreciation = "aime"`. « Passer » laisse `null`.

**G3 — Persistance après redémarrage**
- Action : fermer puis rouvrir l'app.
- Attendu : garde-manger, équipement, préférences, historique et réglage de notification sont conservés
  (Capacitor Preferences).

---

## H. Notification quotidienne

**H1 — Planification**
- Contexte : `reglage_notif = { actif:true, heure:"18:00" }`, permission accordée.
- Attendu : une notification locale est programmée chaque jour à 18:00 et reprogrammée pour le lendemain.

**H2 — Désactivation**
- Action : passer `actif` à false dans Réglages.
- Attendu : toutes les notifications planifiées sont annulées.

**H3 — Permission refusée**
- Contexte : l'utilisateur refuse la permission.
- Attendu : pas de plantage ; l'app fonctionne normalement ; le réglage propose de réactiver plus tard.

---

*Astuce d'implémentation : `engine.js` étant pur, ces scénarios A–F peuvent être couverts par des tests
unitaires en injectant un état (`historique`, `preferences`, etc.) et une « date du jour » simulée, sans
lancer l'application ni les plugins natifs.*
