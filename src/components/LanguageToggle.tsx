import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { changeLanguage, getCurrentLanguage } from '../i18n';

interface Props {
  style?: object;
}

export default function LanguageToggle({ style }: Props) {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const toggle = async () => {
    const newLang = currentLang === 'en' ? 'bn' : 'en';
    await changeLanguage(newLang);
    setCurrentLang(newLang);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggle}
      activeOpacity={0.7}
      accessibilityLabel={t('language.toggleLanguage')}
    >
      <View style={[styles.segment, currentLang === 'en' && styles.segmentActive]}>
        <Text style={[styles.text, currentLang === 'en' && styles.textActive]}>
          {t('language.english')}
        </Text>
      </View>
      <View style={[styles.segment, currentLang === 'bn' && styles.segmentActive]}>
        <Text style={[styles.text, currentLang === 'bn' && styles.textActive]}>
          {t('language.bangla')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.navy900,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
  },
  textActive: {
    color: colors.white,
  },
});
