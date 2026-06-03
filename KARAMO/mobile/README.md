# Coach AI · Mobile (Expo)

App iOS/Android pour Coach AI. Implémentation des 5 blocs principaux à partir
des design packs Claude Design : 6 écrans d'onboarding (bloc 1), Dashboard
(bloc 2), Alertes liste + détail (bloc 3), Chatbot RAG avec drawer (bloc 4),
Profil + 3 sous-écrans (bloc 5).

## Stack

- Expo SDK 54 + Expo Router 6 (file-based routing)
- React Native 0.81, React 19
- TypeScript strict
- Bricolage Grotesque (Google Fonts) + JetBrains Mono pour les identifiants techniques
- Lucide pour les icônes (cohérent avec le design pack web)
- React Native Reanimated pour les animations (stepper, halo, switch, dot pulse)
- React Native SVG pour le logo Coach AI (gradient radial 8 rayons)

## Tokens

Tous les tokens couleurs / espacement / radius / typographie sont dans
`constants/theme.ts` (source : `_design_pack/coach-ai-app-ios/project/design-system/colors_and_type.css`).

## Écrans

| Route             | Écran                          | Comportement                                                |
|-------------------|--------------------------------|-------------------------------------------------------------|
| `/`               | Splash                         | Auto-advance vers `/welcome` après 1800 ms                  |
| `/welcome`        | Bienvenue                      | Carousel 3 features + dots, CTA primary `Commencer`         |
| `/login`          | Login Google                   | Bouton Google blanc, état loading 1400 ms vers `/permissions` |
| `/permissions`    | Push notifications             | Stepper 1/3, halo bleu + bell oscillate, double tap "Plus tard" |
| `/preferences`    | Catégories d'alertes           | Stepper 2/3, 3 toggles (Santé/Productivité/Réunion)         |
| `/device`         | Boîtier IoT                    | Stepper 3/3, halo vert + cpu pulse, pill `EN LIGNE` clignote |
| `/home`           | **Dashboard (bloc 2)**         | Header sticky, insight RAG, segmented Jour/Semaine/Mois, ring SVG animé 4 segments, légende, grid 2×2 cas d'usage, 3 alertes récentes, TabBar 4 onglets |
| `/alerts`         | **Alertes (bloc 3)**           | Liste groupée par jour (sticky), 5 chips de catégorie, search bar collapsible, états loading/empty/filter/search, "Tout marquer lu", TabBar |
| `/alert/[id]`     | **Détail alerte (bloc 3)**     | Header flottant + close, hero icon 200dp animé pop bouncy, body, card contexte multimodal 5 lignes, 3 actions, badge ACTIONNÉE + toast succès, états loading/404 |
| `/chat`           | **Coach AI Chatbot (bloc 4)**  | Header menu + titre + nouvelle conv, bulles user/assistant + label COACH + sources card + curseur streaming, composer multiline, drawer slide-in 80% pour switcher entre conversations, états loading/rag-error/offline/rate-limit |
| `/profile`        | **Profil (bloc 5)**            | Avatar 96dp gradient, nom/email, card boîtier "EN LIGNE" pulse, sections Compte + Apparence, boutons Déconnexion / Supprimer, TabBar |
| `/profile/notifications` | Préférences notifications | 3 ToggleCards (Santé / Productivité / Réunion), card mode silencieux avec switch + range mono 22:00 → 07:00, card urgences rouge |
| `/profile/export` | Export de données              | Hero icon Download, 3 chips période, 2 radio cards format CSV/JSON, 3 check cards items, CTA primary "Exporter" |
| `/profile/about`  | À propos                        | Logo 64dp gradient, version mono, card équipe (Aghzout + Sylla), 3 docs légaux, 2 open source, credits |

## Lancer en local

```bash
cd mobile
npm install
npm run web        # demo navigateur la plus rapide
npm run ios        # necessite macOS
npm run android    # necessite Android Studio / device
```

Pour tester sur ton iPhone : installe **Expo Go**, lance `npm start`, scanne le QR.

## Vérifications

```bash
npx tsc --noEmit       # type-check
npm run lint           # ESLint (0 errors / 0 warnings)
npx expo-doctor        # 17/17 checks
```

## États transverses du Dashboard

Pour tester rapidement les variantes, flippe les flags en tête de
`app/home.tsx` :

- `LOADING = true` : skeletons sur insight + ring + légende
- `EMPTY = true` : insight vide "On apprend tes habitudes : reviens..."
- `OFFLINE = true` : bandeau rouge en haut "Connexion indisponible (données en cache)"

Tous les onglets de la TabBar sont câblés : Accueil → `/home`, Alertes →
`/alerts`, Coach → `/chat`, Profil → `/profile`. Le dispatcher est centralisé
dans `lib/tab-nav.ts`.

## États transverses des Alertes

Détail (`app/alert/[id].tsx`) :
- `LOADING_TEST = true` : skeleton hero rond + lignes shimmer
- `NOT_FOUND_TEST = true` : empty state "Cette alerte n'existe plus"
- Naviguer vers `/alert/inexistent` → 404 state automatique (id introuvable)

Liste (`app/alerts.tsx`) :
- `LOADING_TEST = true` : 5 cartes skeleton groupées
- Filtre vers une catégorie sans match → empty "Rien dans cette catégorie"
- Search avec mot-clé absent → empty "Aucun résultat pour « ... »"

Mock data centralisée dans `constants/alerts-mock.ts` (10 alertes sur 3 jours
avec contexte multimodal). `dashboard-mock.ts` dérive `recentAlerts` et
`totalUnreadCount` de cette source unique.

## États transverses du Chat

`app/chat.tsx` expose 2 flags de QA en tête :

- `STATE_TEST = 'loading'` : 4 skeleton bubbles shimmer
- `STATE_TEST = 'new'` : hero "Pose-moi une question" + 4 suggestions chips animées
- `STATE_TEST = 'rag-error'` : banner rouge "Le coach est temporairement indisponible", composer désactivé
- `STATE_TEST = 'offline'` : banner jaune "Mode hors ligne...", composer désactivé
- `STATE_TEST = 'rate-limit'` : Toast warn en haut, composer désactivé
- `STREAMING_TEST = true` : bulle assistant en cours avec curseur primary blink + bulle user pending

Mock data dans `constants/chat-mock.ts` (5 conversations sur 3 groupes today/week/older,
2 conversations avec messages détaillés). Le drawer (slide-in 80% gauche) gère le
switch entre conversations sans changer de route.

## Source du design

Les design packs originaux sont extraits dans `../_design_pack/` :
- `coach-ai-app-ios/` : pack onboarding (bloc 1)
- `dashboard_pack/coach-ai-app-ios/` : pack dashboard (bloc 2)
- `alerts_pack/coach-ai-app-ios/` : pack alertes (bloc 3)
- `chatbot_pack/coach-ai-app-ios/` : pack chatbot (bloc 4)
- `profile_pack/coach-ai-app-ios/` : pack profil (bloc 5)

Les écrans React Native sont une recréation pixel-aware des prototypes web :
on ne copie pas la structure interne, on reproduit le rendu visuel et les
interactions.
