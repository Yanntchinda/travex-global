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
