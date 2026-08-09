#!/bin/bash
BASE="https://stillnesscuratedretreats.com"
urls=(
"/product-staging/" "/reserve-old/" "/sacred-offerings-old/" "/the-stillness-habit-old/" "/shop-old-feb/"
"/share-old/" "/about-old/" "/blogs-old/" "/corporate-old/" "/curated-calm-old/" "/home-page-dummy/"
"/home-2-3-2/" "/nervous-sytem-reset-duplicate-1131/" "/my-account/" "/cart/" "/checkout/" "/login/"
"/my-audios/" "/editor/" "/shop-2/" "/membership-account/" "/membership-levels/" "/metform-form/new-form-1738960559/"
"/author/iamadmin/" "/category/blog/" "/elementor-hf/stillness-header/" "/jkit-footer/home/"
)
for u in "${urls[@]}"; do
  meta=$(curl -sL "$BASE$u" | grep -oE '<meta[^>]*name="robots"[^>]*>' | head -1)
  printf "%-55s %s\n" "$u" "${meta:0:110}"
done
