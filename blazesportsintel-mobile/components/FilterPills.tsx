import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fonts } from '@/constants/theme';

interface FilterPillsProps {
  options: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
}

export function FilterPills({ options, activeKey, onChange }: FilterPillsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {options.map((option) => {
        const active = option.key === activeKey;
        return (
          <Pressable
            key={option.key}
            accessibilityLabel={`Filter by ${option.label}`}
            style={[styles.pill, active ? styles.activePill : styles.inactivePill]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.label, active ? styles.activeLabel : styles.inactiveLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 8 },
  pill: { borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 8 },
  activePill: { backgroundColor: colors.burntOrange },
  inactivePill: { backgroundColor: colors.charcoal },
  label: { fontFamily: fonts.mono, fontSize: 12 },
  activeLabel: { color: colors.midnight },
  inactiveLabel: { color: colors.dust }
});
