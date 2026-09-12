#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Vérification du code RÉEL du projet (services + écrans), sans appareil ni
// Metro : `npm run check`.
//
// Ce script n'implémente aucune logique métier : il charge les modules de src/
// (compilés à la volée par ./setup.js) et les exécute / les rend vraiment.
// ---------------------------------------------------------------------------
global.__DEV__ = true;
const path = require('path');
const assert = require('assert');
const { BASE, SRC, compiled } = require('./setup');

const React = require('react');
const TestRenderer = require('react-test-renderer');
const RN = require(path.join(BASE, 'node_modules', 'react-native')); // stub partagé
const AS = require(path.join(BASE, 'node_modules', '@react-native-async-storage', 'async-storage'));

const svc = require(path.join(SRC, 'services/supabase.js'));
const { LanguageProvider } = require(path.join(SRC, 'context/LanguageContext'));
const { AuthProvider } = require(path.join(SRC, 'context/AuthContext'));
const ReservationsScreen = require(path.join(SRC, 'screens/tabs/ReservationsScreen')).default;
const TripDetailScreen = require(path.join(SRC, 'screens/detail/TripDetailScreen')).default;
const NotificationsScreen = require(path.join(SRC, 'screens/profile/NotificationsScreen')).default;
const HomeScreen = require(path.join(SRC, 'screens/home/HomeScreen')).default;

// ---------- outillage ----------
let pass = 0;
const failures = [];
function check(label, fn) {
  try { fn(); pass++; console.log('  ok  -', label); }
  catch (e) { failures.push(label); console.log('  ÉCHEC -', label, '→', e.message); }
}
const suite = (title) => console.log('\n' + title);
const flush = async () => { await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); };

function texts(node, acc = []) {
  if (node == null) return acc;
  if (typeof node === 'string' || typeof node === 'number') { acc.push(String(node)); return acc; }
  if (Array.isArray(node)) { node.forEach((n) => texts(n, acc)); return acc; }
  if (node.children) texts(node.children, acc);
  return acc;
}
const allText = (r) => texts(r.toJSON()).join(' | ');

async function render(element) {
  let r;
  await TestRenderer.act(async () => { r = TestRenderer.create(element); await flush(); await flush(); });
  return r;
}
const withProviders = (el) => React.createElement(LanguageProvider, null, React.createElement(AuthProvider, null, el));
function touchables(r, needle) {
  return r.root.findAll((n) => n.type === RN.TouchableOpacity).filter((n) => {
    try {
      return n.findAll((x) => x.type === RN.Text, { deep: true })
        .some((x) => String(x.props.children).includes(needle));
    } catch { return false; }
  });
}
const setSession = async (user) => {
  await AS.default.setItem('travex.session', JSON.stringify('active'));
  await AS.default.setItem('travex.user', JSON.stringify(user));
};
const DEMO_VERIFIED = { id: 'verified_1', email: 'demo@travexglobal.com', firstName: 'Jean', lastName: 'Dupont', initials: 'JD', verified: true, role: 'traveler' };
const nav = { goBack() {}, navigate() {}, addListener: () => () => {} };

(async () => {
  console.log(`${compiled} modules compilés depuis src/`);

  // ================= A. Suivi des colis : 3 statuts, plus d'étape « atterri »
  suite('A. Espace Réservations — statuts et PIN de livraison');
  await AS.default.clear();
  const seeded = await svc.ensureShipmentsSeeded();
  check('le jeu de démonstration ne contient aucun statut « landed »', () => {
    assert.strictEqual(seeded.filter((s) => s.status === 'landed').length, 0);
  });
  check('seuls pending / in_transit / delivered existent', () => {
    seeded.forEach((s) => assert.ok(['pending', 'in_transit', 'delivered'].includes(s.status), s.status));
  });

  await AS.default.setItem('travex.shipments', JSON.stringify([
    { id: 'legacy1', ref: 'GP-4242', role: 'sender', status: 'landed', pin: '9911', weight: 3, parcel: 'Legacy', from: 'Douala', to: 'Paris' },
    { id: 'legacy2', ref: 'GP-7777', role: 'traveler', status: 'landed', pin: null, weight: 4, parcel: 'Legacy 2', from: 'Douala', to: 'Paris' },
  ]));
  const migrated = await svc.getShipments();
  check('les anciennes données « landed » sont migrées en « in_transit »', () => {
    migrated.forEach((s) => assert.notStrictEqual(s.status, 'landed'));
  });
  check('un colis « en cours » sans PIN en reçoit un (4 chiffres)', () => {
    const s = migrated.find((x) => x.id === 'legacy2');
    assert.ok(/^\d{4}$/.test(String(s.pin)), String(s.pin));
    assert.ok(s.qrData, 'QR manquant');
  });
  check('sécurité : le PIN n’est jamais égal aux chiffres de la référence', () => {
    migrated.forEach((s) => {
      if (s.pin) assert.notStrictEqual(String(s.pin), String(s.ref).replace(/\D/g, ''));
    });
  });
  const r3 = await svc.setShipmentStatus('legacy1', 'landed');
  check('setShipmentStatus(landed) retombe sur « in_transit »', () => assert.strictEqual(r3.found.status, 'in_transit'));
  const r4 = await svc.setShipmentStatus('legacy2', 'delivered');
  check('setShipmentStatus(delivered) enregistre la livraison', () => assert.strictEqual(r4.found.status, 'delivered'));
  await svc.upsertShipment({ id: 'new1', ref: 'GP-1357', role: 'sender', status: 'in_transit', parcel: 'Nouveau', weight: 2, from: 'Douala', to: 'Geneve' });
  const new1 = (await svc.getShipments()).find((x) => x.id === 'new1');
  check('upsertShipment(in_transit) génère PIN + QR', () => {
    assert.ok(/^\d{4}$/.test(String(new1.pin)), String(new1.pin));
    assert.strictEqual(new1.qrData, 'GP-SAFE-1357');
  });
  const notifsA = await svc.getNotifications();
  check('la notification « Colis pris en charge ✈️ » remplace « Le vol a atterri »', () => {
    const t = notifsA.find((n) => n.type === 'transit');
    assert.ok(t, 'aucune notification transit');
    assert.strictEqual(t.title_fr, 'Colis pris en charge ✈️');
    assert.ok(!notifsA.some((n) => n.type === 'landing'));
  });
  check('aucun libellé « atterri / landed » dans les notifications', () => {
    notifsA.forEach((n) => {
      assert.ok(!/atterri/i.test((n.title_fr || '') + (n.body_fr || '')), n.title_fr);
      assert.ok(!/landed/i.test((n.title_en || '') + (n.body_en || '')), n.title_en);
    });
  });
  const earnings = await svc.getEarnings();
  check('getEarnings : « delivered » → available, sinon pending', () => {
    assert.strictEqual(earnings.find((e) => e.id === 'legacy2').status, 'available');
  });

  // ================= B. Diffusion aux comptes vérifiés (CNI)
  suite('B. Diffusion des publications — comptes vérifiés CNI uniquement');
  await AS.default.clear();
  await AS.default.setItem('travex.users', JSON.stringify([
    { id: 'u1', email: 'verifie@travex.cm', firstName: 'Awa', verified: true, verificationPending: false },
    { id: 'u2', email: 'attente@travex.cm', firstName: 'Boris', verified: false, verificationPending: true },
  ]));
  await setSession(DEMO_VERIFIED);

  const recipients = await svc.getVerifiedRecipients();
  check('destinataires = comptes vérifiés uniquement', () => {
    assert.deepStrictEqual(recipients.map((u) => u.email).sort(), ['demo@travexglobal.com', 'verifie@travex.cm']);
  });
  check('un compte sans CNI validée est exclu', () => {
    assert.ok(!recipients.some((u) => u.email === 'attente@travex.cm'));
  });
  const bc = await svc.broadcastNewListing(
    { from: 'Douala', to: 'Paris', isDemande: false, userName: 'Awa N.', fromDate: '12.09.2026', transport: 'Avion' },
    'verifie@travex.cm'
  );
  check('l’auteur ne reçoit pas sa propre publication', () => assert.strictEqual(bc.count, 1));
  check('libellé « Nouveau départ publié 📢 » (FR/EN, icône megaphone)', () => {
    assert.strictEqual(bc.notif.title_fr, 'Nouveau départ publié 📢');
    assert.strictEqual(bc.notif.title_en, 'New departure published 📢');
    assert.strictEqual(bc.notif.icon, 'megaphone');
    assert.ok(/Awa N\. · Douala → Paris/.test(bc.notif.body_fr), bc.notif.body_fr);
  });
  const inbox = JSON.parse(await AS.default.getItem('travex.broadcasts'));
  check('le compte non vérifié n’a rien reçu', () => assert.ok(!inbox['attente@travex.cm'], Object.keys(inbox).join(',')));
  check('le compte vérifié a bien reçu', () => assert.ok(inbox['demo@travexglobal.com'].length >= 1));
  const listB = await svc.getNotifications();
  check('la diffusion apparaît dans le fil in-app', () => {
    assert.ok(listB.some((n) => n.id === bc.notif.id));
  });
  check('la diffusion n’apparaît qu’UNE fois (pas de doublon)', () => {
    assert.strictEqual(listB.filter((n) => n.id === bc.notif.id).length, 1);
  });
  const ann = await svc.createTrip({
    from: 'Yaounde', to: 'Geneve', isDemande: true, userName: 'Jean D.',
    userEmail: 'verifie@travex.cm', deadline: '20.09.2026', status: 'attente',
  });
  check('createTrip() diffuse automatiquement (broadcastCount)', () => assert.ok(ann.broadcastCount >= 1));
  const listB2 = await svc.getNotifications();
  check('une demande publiée donne « Nouvelle demande de colis 📢 »', () => {
    assert.ok(listB2.some((n) => n.type === 'newListing' && /demande de colis/i.test(n.title_fr)),
      listB2.map((n) => n.title_fr).join(' | '));
  });
  await svc.savePushToken('demo@travexglobal.com', 'ExponentPushToken[TEST]');
  const tokens = await svc.getPushTokens();
  check('le jeton push est enregistré pour le compte connecté', () => {
    assert.strictEqual(tokens['demo@travexglobal.com'].token, 'ExponentPushToken[TEST]');
  });

  // ================= C. Écrans Réservations + détail d'annonce
  suite('C. Écran Réservations (expéditeur puis KiloPass)');
  await AS.default.clear();
  await setSession(DEMO_VERIFIED);
  const res = await render(withProviders(React.createElement(ReservationsScreen)));
  let out = allText(res);
  check('l’écran s’affiche', () => assert.ok(out.includes('Réservations')));
  check('aucune mention « Vol atterri »', () => assert.ok(!/Vol atterri/i.test(out), out.slice(0, 200)));
  check('« Vol terminé » absent tant que rien n’est livré', () => assert.ok(!/Vol terminé/i.test(out), out.slice(0, 200)));
  check('le colis en cours affiche « En transit »', () => assert.ok(out.includes('En transit')));
  check('le PIN de l’expéditeur est affiché', () => assert.ok(out.includes('5730')));

  const kilo = touchables(res, 'KiloPass');
  check('onglet KiloPass présent', () => assert.strictEqual(kilo.length, 1));
  await TestRenderer.act(async () => { kilo[0].props.onPress(); await flush(); });
  out = allText(res);
  check('côté voyageur : aucune mention « Vol atterri »', () => assert.ok(!/Vol atterri/i.test(out)));
  check('côté voyageur : colis en attente → « Vol à venir » + scan du QR', () => {
    assert.ok(out.includes('Vol à venir'));
    assert.ok(out.includes('Scanner ou Importer le QR Code'));
  });
  check('côté voyageur : colis en cours → saisie du PIN', () => {
    assert.ok(out.includes('Saisir le Code PIN fourni par le destinataire'));
  });
  check('côté voyageur : colis livré → « Colis livré avec succès » + « Vol terminé »', () => {
    assert.ok(out.includes('Colis livré avec succès'));
    assert.ok(out.includes('Vol terminé'));
  });

  const pinBtn = touchables(res, 'Saisir le Code PIN');
  check('le bouton PIN ouvre la modale (livraison non automatique)', () => assert.strictEqual(pinBtn.length, 1));
  await TestRenderer.act(async () => { pinBtn[0].props.onPress(); await flush(); });
  check('la modale de saisie du PIN s’ouvre', () => assert.ok(allText(res).includes('Code PIN de livraison')));

  const typePin = async (str) => {
    for (let i = 0; i < str.length; i++) {
      const fields = res.root.findAll((n) => n.type === RN.TextInput);
      const d = str[i];
      await TestRenderer.act(async () => { fields[i].props.onChangeText(d); await flush(); });
    }
  };
  RN.__alerts.length = 0;
  await typePin('0000');
  await TestRenderer.act(async () => { touchables(res, 'Valider et marquer')[0].props.onPress(); await flush(); });
  check('PIN erroné → alerte « Code PIN incorrect »', () => {
    assert.ok(RN.__alerts.some((a) => /incorrect/i.test(String(a.msg))), JSON.stringify(RN.__alerts));
  });
  const stillTransit = (await svc.getShipments()).find((x) => x.id === 's3');
  check('PIN erroné → le colis reste « in_transit »', () => assert.strictEqual(stillTransit.status, 'in_transit'));
  RN.__alerts.length = 0;
  await typePin('2915');
  await TestRenderer.act(async () => { touchables(res, 'Valider et marquer')[0].props.onPress(); await flush(); await flush(); });
  check('PIN correct → « Colis livré avec succès »', () => {
    assert.ok(RN.__alerts.some((a) => /livré avec succès/i.test(String(a.title))), JSON.stringify(RN.__alerts));
  });
  const delivered = (await svc.getShipments()).find((x) => x.id === 's3');
  check('PIN correct → statut « delivered » enregistré', () => assert.strictEqual(delivered.status, 'delivered'));
  check('le bouton PIN disparaît après livraison', () => assert.ok(!allText(res).includes('Saisir le Code PIN')));

  suite('D. Détail d’une annonce de départ — visiteur vs compte');
  await AS.default.clear(); // aucun compte connecté
  const guest = await render(withProviders(React.createElement(TripDetailScreen, { route: { params: { id: 'inconnu' } }, navigation: nav })));
  const gout = allText(guest);
  check('visiteur : bandeau « Aperçu limité »', () => assert.ok(gout.includes('Aperçu limité')));
  check('visiteur : bloc « Réservé aux membres »', () => assert.ok(gout.includes('Réservé aux membres')));
  check('visiteur : trajet et tarif publics', () => {
    assert.ok(gout.includes('Tarif par Kilo'));
    assert.ok(gout.includes('€'));
  });
  check('visiteur : AUCUN accès réservation / messagerie / paiement', () => {
    assert.ok(!/Réserver/i.test(gout), gout.slice(-200));
    assert.ok(!/Contacter/i.test(gout), gout.slice(-200));
    assert.ok(!/Orange Money|PayPal/i.test(gout), gout.slice(0, 400));
  });
  check('visiteur : CTA connexion + déblocage', () => {
    assert.ok(gout.includes('Se connecter'));
    assert.ok(gout.includes('Débloquer les détails'));
  });

  await setSession(DEMO_VERIFIED);
  const logged = await render(withProviders(React.createElement(TripDetailScreen, { route: { params: { id: 'inconnu' } }, navigation: nav })));
  const lout = allText(logged);
  check('connecté : détails COMPLETS (pas d’aperçu limité)', () => assert.ok(!lout.includes('Aperçu limité')));
  check('connecté : modes de paiement + réservation + contact', () => {
    assert.ok(lout.includes('Modes de paiement acceptés'));
    assert.ok(/Réserver/i.test(lout));
    assert.ok(/Contacter/i.test(lout));
  });

  // ================= E. Notifications : affichage réel
  suite('E. Écran Notifications et badge d’accueil');
  await AS.default.clear();
  await AS.default.setItem('travex.users', JSON.stringify([
    { id: 'u1', email: 'verifie@travex.cm', verified: true },
    { id: 'u2', email: 'attente@travex.cm', verified: false },
  ]));
  await setSession(DEMO_VERIFIED);
  await svc.broadcastNewListing(
    { from: 'Douala', to: 'Paris', isDemande: false, userName: 'Awa N.', fromDate: '12.09.2026' },
    'verifie@travex.cm'
  );
  const nScreen = await render(withProviders(React.createElement(NotificationsScreen, { navigation: nav })));
  const nout = allText(nScreen);
  check('la diffusion est listée dans l’écran Notifications', () => assert.ok(nout.includes('Nouveau départ publié 📢'), nout.slice(0, 300)));
  check('auteur + trajet visibles dans le corps', () => assert.ok(/Awa N\. · Douala → Paris/.test(nout)));
  check('affichée une seule fois', () => {
    assert.strictEqual(nout.split('Nouveau départ publié').length - 1, 1);
  });
  const row = touchables(nScreen, 'Nouveau départ publié')[0];
  check('la notification est cliquable', () => assert.ok(row));
  await TestRenderer.act(async () => { row.props.onPress(); await flush(); });
  check('le détail de la notification s’ouvre', () => assert.ok(/Awa N\. · Douala → Paris/.test(allText(nScreen))));

  const home = await render(withProviders(React.createElement(HomeScreen, { navigation: nav })));
  check('le badge de la cloche compte la diffusion (4 non lues)', () => {
    assert.ok(/\b4\b/.test(allText(home)), allText(home).slice(0, 200));
  });

  // ================= F. Identité : 3 photos de CNI, visibles et téléchargeables
  suite('F. Identité — 3 photos de CNI (plus de numéro), visibles et téléchargeables');
  const demo = require(path.join(SRC, 'services/demoCni.js'));
  const { missingCniFields } = require(path.join(SRC, 'components/CniUploads'));
  const CniUploads = require(path.join(SRC, 'components/CniUploads')).default;
  const CniDocsView = require(path.join(SRC, 'components/CniDocsView')).default;
  const ChangeStatusScreen = require(path.join(SRC, 'screens/profile/ChangeStatusScreen')).default;
  const EFS = require(path.join(BASE, 'node_modules', 'expo-file-system', 'legacy.js'));
  const Sharing = require(path.join(BASE, 'node_modules', 'expo-sharing'));
  const Picker = require(path.join(BASE, 'node_modules', 'expo-image-picker'));
  // Un testID apparaît sur le composant ET sur son élément hôte : on ne garde
  // que l'instance composite (celle qui reçoit vraiment onPress).
  const byTestId = (r, id) => r.root.findAll((n) => n.type === RN.TouchableOpacity && n.props.testID === id);

  await AS.default.clear();

  // 1. inscription d'un voyageur avec les 3 photos téléversées
  const newUser = await svc.registerUser({
    firstName: 'Marie', lastName: 'Ngo', email: 'marie@travex.cm', password: 'Motdepasse1',
    location: 'Yaoundé', phone: '+237 6 00 00 00 00', role: 'traveler',
    cniFront: demo.DEMO_CNI_DOCS.front, cniBack: demo.DEMO_CNI_DOCS.back, cniSelfie: demo.DEMO_CNI_DOCS.selfie,
  });
  check('l’inscription enregistre les 3 photos de la CNI', () => {
    assert.ok(newUser.cniFront && newUser.cniBack && newUser.cniSelfie);
  });
  check('aucun numéro de CNI n’est collecté ni stocké', () => {
    assert.ok(!('cniNumber' in newUser), 'clés: ' + Object.keys(newUser).join(','));
  });
  check('getCniDocs renvoie recto, verso, selfie dans l’ordre', () => {
    assert.deepStrictEqual(svc.getCniDocs(newUser).map((d) => d.key), ['front', 'back', 'selfie']);
  });
  check('un ancien compte avec cniPhoto retrouve son recto', () => {
    const legacy = svc.getCniDocs({ cniPhoto: 'data:image/png;base64,AAAA' });
    assert.strictEqual(legacy.length, 1);
    assert.strictEqual(legacy[0].key, 'front');
  });
  check('hasCniDocs exige bien les 3 documents', () => {
    assert.ok(svc.hasCniDocs(newUser));
    assert.ok(!svc.hasCniDocs({ cniFront: 'x', cniBack: 'y' }));
  });
  check('missingCniFields liste ce qui manque au formulaire', () => {
    assert.deepStrictEqual(missingCniFields({ front: 'a' }), ['back', 'selfie']);
  });

  // 2. espace admin : les 3 documents sont affichés
  const view = await render(withProviders(React.createElement(CniDocsView, { user: newUser })));
  check('l’admin voit les 3 documents (recto, verso, selfie)', () => {
    ['front', 'back', 'selfie'].forEach((k) => {
      assert.strictEqual(byTestId(view, 'cniDoc-' + k).length, 1, 'manque cniDoc-' + k);
    });
  });
  check('chaque document a son bouton « Télécharger »', () => {
    ['front', 'back', 'selfie'].forEach((k) => {
      assert.strictEqual(byTestId(view, 'cniDownload-' + k).length, 1, 'manque cniDownload-' + k);
    });
  });
  check('les 3 images sont réellement chargées depuis les documents', () => {
    const uris = view.root.findAll((n) => n.type === RN.Image && n.props.source && n.props.source.uri)
      .map((n) => n.props.source.uri);
    assert.ok(uris.includes(demo.DEMO_CNI_DOCS.front), 'recto absent');
    assert.ok(uris.includes(demo.DEMO_CNI_DOCS.back), 'verso absent');
    assert.ok(uris.includes(demo.DEMO_CNI_DOCS.selfie), 'selfie absent');
  });

  // 3. téléchargement réel : écriture du fichier + feuille de partage système
  EFS.__writes.length = 0;
  Sharing.__shared.length = 0;
  const dlBtn = byTestId(view, 'cniDownload-back')[0];
  await TestRenderer.act(async () => { dlBtn.props.onPress(); await flush(); });
  check('« Télécharger » écrit le fichier puis ouvre le partage', () => {
    assert.strictEqual(EFS.__writes.length, 1, 'écritures: ' + EFS.__writes.length);
    assert.strictEqual(Sharing.__shared.length, 1, 'partages: ' + Sharing.__shared.length);
  });
  check('le fichier écrit contient les octets exacts du verso', () => {
    const written = EFS.__writes[0];
    assert.ok(demo.DEMO_CNI_DOCS.back.endsWith(written.contents), 'contenu ≠ base64 du document');
    assert.strictEqual(written.options.encoding, 'base64');
  });
  check('le nom du fichier identifie le compte et le document', () => {
    assert.ok(/CNI-marie-back\.png$/.test(Sharing.__shared[0].url), Sharing.__shared[0].url);
  });

  // 4. visionneuse plein écran
  const openBtn = byTestId(view, 'cniDoc-selfie')[0];
  await TestRenderer.act(async () => { openBtn.props.onPress(); await flush(); });
  check('tap sur une miniature → visionneuse plein écran + téléchargement', () => {
    assert.ok(allText(view).includes('Vous tenant la CNI'), allText(view).slice(0, 200));
    assert.strictEqual(byTestId(view, 'cniDownload-selfie').length, 1);
  });

  // 5. téléversement : la photo devient une data URI persistante
  Picker.__setResult({ canceled: false, assets: [{ uri: 'file:///tmp/pick.jpg', mimeType: 'image/jpeg', base64: 'AAECAwQ=' }] });
  let picked = null;
  const up = await render(withProviders(React.createElement(CniUploads, { value: {}, onChange: (v) => { picked = v; } })));
  check('3 zones de téléversement : recto, verso, selfie', () => {
    ['front', 'back', 'selfie'].forEach((k) => {
      assert.strictEqual(byTestId(up, 'cni-' + k).length, 1, 'manque cni-' + k);
    });
  });
  check('aucune consigne « Trois documents sont exigés… » au-dessus des uploads', () => {
    const out = allText(up);
    assert.ok(!out.includes('Trois documents sont exig'), out.slice(0, 300));
    assert.ok(!out.includes('no ID number is asked'), out.slice(0, 300));
  });
  const frontBox = byTestId(up, 'cni-front')[0];
  await TestRenderer.act(async () => { frontBox.props.onPress(); await flush(); });
  check('la photo choisie est convertie en data URI (persistante + téléchargeable)', () => {
    assert.ok(picked && picked.front === 'data:image/jpeg;base64,AAECAwQ=', JSON.stringify(picked));
  });
  check('la galerie est ouverte en demandant explicitement le base64', () => {
    const opts = Picker.__calls[Picker.__calls.length - 1];
    assert.strictEqual(opts.base64, true);
  });

  // 6. écran « Changer de statut » : plus aucun champ « numéro de CNI »
  await AS.default.clear();
  await setSession({ ...DEMO_VERIFIED, verified: false, verificationPending: false, role: 'sender' });
  const st = await render(withProviders(React.createElement(ChangeStatusScreen, { navigation: nav })));
  check('« Changer de statut » ne demande plus de numéro de CNI', () => {
    assert.ok(!JSON.stringify(st.toJSON()).includes('number-pad'), 'un clavier numérique subsiste');
    assert.ok(!allText(st).includes('Numéro de CNI'), allText(st).slice(0, 300));
  });
  check('« Changer de statut » propose les 3 téléversements', () => {
    ['front', 'back', 'selfie'].forEach((k) => {
      assert.strictEqual(byTestId(st, 'cni-' + k).length, 1, 'manque cni-' + k);
    });
  });
  const sendBtn = touchables(st, 'Envoyer pour vérification')[0];
  await TestRenderer.act(async () => { sendBtn.props.onPress(); await flush(); });
  check('envoi sans les 3 photos → refus avec le message CNI', () => {
    assert.ok(allText(st).includes('Les 3 photos sont obligatoires'), allText(st).slice(0, 400));
  });

  // 7. écran ADMIN réel : onglet « Profils à vérifier » → fiche → documents
  const AdminScreen = require(path.join(SRC, 'screens/admin/AdminScreen')).default;
  await AS.default.clear();
  await AS.default.setItem('travex.users', JSON.stringify([
    { ...newUser, id: 'u_admin_test', verificationPending: true, verified: false },
  ]));
  await setSession({ id: 'admin_1', email: 'admin@travexglobal.com', role: 'admin', verified: true });
  const admin = await render(withProviders(React.createElement(AdminScreen, { navigation: nav })));
  const profTab = touchables(admin, 'Profils à vérifier')[0];
  await TestRenderer.act(async () => { profTab.props.onPress(); await flush(); });
  check('l’onglet « Profils à vérifier » liste le compte déposé', () => {
    assert.ok(allText(admin).includes('Marie  Ngo') || allText(admin).includes('marie@travex.cm'), allText(admin).slice(0, 300));
  });
  const openProfile = touchables(admin, 'Voir les références')[0];
  await TestRenderer.act(async () => { openProfile.props.onPress(); await flush(); });
  check('la fiche profil affiche la section « Documents d’identité »', () => {
    assert.ok(allText(admin).includes('Documents d\u2019identit\u00e9'), allText(admin).slice(0, 400));
  });
  check('la fiche profil montre les 3 photos (recto, verso, selfie)', () => {
    ['front', 'back', 'selfie'].forEach((k) => {
      assert.strictEqual(byTestId(admin, 'cniDoc-' + k).length, 1, 'manque cniDoc-' + k);
    });
  });
  check('la fiche profil ne mentionne aucun numéro de CNI', () => {
    assert.ok(!allText(admin).includes('Numéro de CNI'), allText(admin).slice(0, 300));
  });
  EFS.__writes.length = 0;
  Sharing.__shared.length = 0;
  const adminDl = byTestId(admin, 'cniDownload-front')[0];
  await TestRenderer.act(async () => { adminDl.props.onPress(); await flush(); });
  check('depuis la fiche admin, « Télécharger » produit bien un fichier', () => {
    assert.strictEqual(EFS.__writes.length, 1);
    assert.ok(/CNI-marie-front\.png$/.test(Sharing.__shared[0].url), Sharing.__shared[0].url);
    assert.ok(demo.DEMO_CNI_DOCS.front.endsWith(EFS.__writes[0].contents));
  });

  // ---------- bilan ----------
  console.log('\n' + '-'.repeat(56));
  if (failures.length) {
    console.log(`${pass} vérifications ok, ${failures.length} ÉCHEC(S) :`);
    failures.forEach((f) => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log(`${pass} vérifications ok, 0 échec.`);
  process.exit(0);
})().catch((e) => { console.error('ERREUR', e); process.exit(1); });
