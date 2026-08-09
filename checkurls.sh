#!/bin/bash
BASE="https://stillnesscuratedretreats.com"
urls=(
"/my-account/" "/membership/" "/tickets-checkout/" "/tickets-order/" "/shop-2/" "/cart/" "/login/"
"/membership-account/your-profile/" "/nervous-sytem-reset-duplicate-1131/" "/my-audios/" "/editor/"
"/nervous-sytem-reset/" "/newsletter-sign-up/" "/reviews/" "/echo-project/" "/contact/" "/digital-journal/"
"/astrology/" "/product-staging/" "/reserve-old/" "/sacred-offerings-old/" "/curated-calm/"
"/the-stillness-habit-old/" "/stillness-habit/" "/shop-old-feb/" "/checkout/" "/shop/" "/reserve/"
"/share-old/" "/share/" "/summer2026-floating-sessions/" "/sacred-offerings/" "/corporate/" "/blogs/"
"/about-old/" "/blogs-old/" "/corporate-old/" "/curated-calm-old/" "/home-page-dummy/" "/membership-account/"
"/membership-account/membership-billing/" "/membership-account/membership-cancel/" "/membership-account/membership-orders/"
"/membership-checkout/" "/membership-checkout/membership-confirmation/" "/membership-levels/" "/men-series/"
"/affirmation-cards-decks/" "/kids-mindfulness-deck-for-emotional-wellbeing/" "/home-2-3-2/" "/about/"
"/hawaii-retreat/" "/events/" "/category/blog/" "/product-category/stillness/" "/product-category/events/" "/author/iamadmin/"
"/metform-form/new-form-1738960559/" "/metform-form/new-form-1739224437/" "/metform-form/subscribe/"
"/metform-form/corporate-page-form/" "/metform-form/stillness-newsletter/" "/metform-form/share-your-story/"
"/metform-form/events/" "/metform-form/hawaii-retreat-v2/" "/elementor-hf/elementor-5115/" "/elementor-hf/stillness-header/"
"/jkit-footer/home/"
)
for u in "${urls[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE$u")
  printf "%s  %s\n" "$code" "$u"
done
