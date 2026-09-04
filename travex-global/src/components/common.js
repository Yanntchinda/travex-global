import React from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

// ---------- Bouton principal ----------
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }) {
  const bg =
    variant === 'green' ? colors.green :
    variant === 'outline' ? colors.white :
    variant === 'danger' ? colors.red :
    colors.primary;
  const color = variant === 'outline' ? colors.primary : colors.white;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg },
        variant === 'outline' && styles.btnOutline,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && <Ionicons name={icon} size={18} color={color} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, { color }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------- Champ de saisie ----------
export function Input({ label, icon, rightIcon, onRightPress, containerStyle, ...props }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, containerStyle]}>
        {icon && <Ionicons name={icon} size={20} color={colors.muted} style={styles.inputIcon} />}
        <TextInput
          placeholderTextColor="#9AA3AF"
          style={styles.input}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ---------- Carte ----------
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------- En-tête d'écran avec flèche retour ----------
export function ScreenHeader({ title, onBack, right, rightIcon, onRight }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
      ) : <View style={styles.headerBtn} />}
      <Text style={styles.headerTitle}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity onPress={onRight} style={styles.headerBtn}>
          <Ionicons name={rightIcon} size={24} color={colors.primaryDark} />
        </TouchableOpacity>
      ) : <View style={styles.headerBtn} />}
    </View>
  );
}

// ---------- Étoiles de notation ----------
export function Stars({ value = 0, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= value ? 'star' : 'star-outline'}
          size={size}
          color={colors.star}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

// ---------- Badge ----------
export function Badge({ label, color, textColor, icon }) {
  return (
    <View style={[styles.badge, { backgroundColor: color || colors.green }]}>
      {icon && <Ionicons name={icon} size={12} color={textColor || '#fff'} style={{ marginRight: 4 }} />}
      <Text style={[styles.badgeText, { color: textColor || '#fff' }]}>{label}</Text>
    </View>
  );
}

// ---------- Écran de chargement ----------
export function Loading({ text = 'Chargement…' }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.muted, marginTop: learningMargin }}>{text}</Text>
    </View>
  );
}
const learningMargin = 12;

// ---------- État vide ----------
export function EmptyState({ icon = 'calendar-outline', title, subtitle }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={70} color={colors.primary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ---------- Conteneur clavier sécurisé (formulaires) ----------
export function Screen({ children, scroll = true }) {
  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.screenContent}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  rightIcon: { padding: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
});
