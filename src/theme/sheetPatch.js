// ---------------------------------------------------------------------------
// Patch de StyleSheet.create — registre global pour le MODE SOMBRE.
//
// Pourquoi ? Tous les écrans créent leurs styles au chargement du module
// (`const styles = StyleSheet.create({...})`) avec les couleurs du moment.
// Pour changer de thème sans tout réécrire, on intercepte chaque create()
// pour garder une référence vivante vers la feuille de styles ; quand le
// thème change, applyTheme() (theme/theme.js) réécrit les couleurs dans
// ces objets via swapSheets(), puis l'app est re-mountée : chaque style
// {styles.x} est relu au rendu avec les nouvelles valeurs.
//
// Ce module doit être importé EN PREMIER (index.js) pour wraper create()
// avant que le moindre écran ne construise ses styles.
// ---------------------------------------------------------------------------
import { StyleSheet } from 'react-native';

const registry = [];

if (!StyleSheet.create.__travexPatched) {
  const original = StyleSheet.create;
  const wrapped = (styles) => {
    registry.push(styles);
    return styles; // objet vivant : ses valeurs pourront être réécrites
  };
  wrapped.__travexPatched = true;
  StyleSheet.create = wrapped;
  // Garde-fou : si un autre module gardait la version d'origine.
  if (original && original.__travexPatched !== undefined) original.__travexPatched = undefined;
}

// Réécrit les couleurs dans toutes les feuilles enregistrées.
// map = { ancienneCouleur: nouvelleCouleur }
// Chaque feuille est { nom: { propriété: valeur, ... } } : on descend d'un
// niveau (et dans les tableaux type transform) pour atteindre les couleurs.
export function swapSheets(map) {
  if (!Object.keys(map).length) return;
  const swapVal = (v) => {
    if (typeof v === 'string') return map[v] !== undefined ? map[v] : v;
    if (Array.isArray(v)) { v.forEach((x, i) => { v[i] = swapVal(x); }); return v; }
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) v[k] = swapVal(v[k]);
      return v;
    }
    return v;
  };
  for (const sheet of registry) {
    for (const name of Object.keys(sheet)) {
      const style = sheet[name];
      if (style && typeof style === 'object') swapVal(style);
    }
  }
}
