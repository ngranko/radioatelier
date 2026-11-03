# Glossary

Archive and Notion sync terms are defined in [CONTEXT.md](CONTEXT.md).

- **Object selection**: the accepted choice of an Object or Map point shown in the details overlay. `src/lib/services/objectSelection.ts` owns confirmation before switching, temporary pins, opening and closing, navigation, and focus coordination. The choice outlives its rendered Marker; confirmed Object deletion closes it. Marker focus remains responsible for highlighting and centering.
