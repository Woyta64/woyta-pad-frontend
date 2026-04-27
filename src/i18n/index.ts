import { createI18n } from 'vue-i18n'
import en from './en.json'
import cs from './cs.json'
import ja from './ja.json'
import de from './de.json'
import es from './es.json'
import it from './it.json'
import sk from './sk.json'
import fr from './fr.json'
import ko from './ko.json'

const LOCALE_STORAGE_KEY = 'woyta-pad-locale'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem(LOCALE_STORAGE_KEY) ?? 'en',
  fallbackLocale: 'en',
  messages: { en, cs, ja, de, es, it, sk, fr, ko },
})

export { LOCALE_STORAGE_KEY }
export default i18n