DiagramsUI
===

Examples
---
### Sequential

```text
Sequential
    columns
        user:Utilisateur
        site:exemple.fr
        oauth2:Oauth2
        idp:IDP
    sequence:Hello Sequence 1
        user:Visite
        user->site:Description de segment
        site:non connecté
        site->oauth2
        oauth2:Dans le SSO
        oauth2<->idp
        idp:bouboup
        idp->idp
        idp:second part
        idp-->site
        site:Test
        ---
        site:Hello world
---
    sequence:Hello Sequence 2
        user->oauth2
        oauth2:bouboup
```

`-` between deux columns ids to create a segment

`--` used for dashed segment

`<>` before or after any segments to setup directional arrows

`---` in sequence or between sequence to make a separator