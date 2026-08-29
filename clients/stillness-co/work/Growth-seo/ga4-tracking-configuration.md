# Stillness Co. — GA4 & Key Events Tracking Specification

**Platform**: Google Analytics 4 (GA4)  
**Implementation Route**: Google Site Kit / Google Tag Manager (GTM)  
**Measurement ID**: `G-STILLNESS_KEY` (managed under `work.yeswanth@gmail.com`)

---

## 1. Key Conversion Events Matrix

Configure the following Custom Events and mark them as **Key Events (Conversions)** in GA4 Admin → Events:

| Event Name | Trigger Condition | Parameters Tracked | Business Significance |
|---|---|---|---|
| `purchase` | WooCommerce Thank You / Order Received page | `transaction_id`, `value`, `currency` (CAD), `items` | Direct revenue from tickets / retreats |
| `begin_checkout` | User initiates `/checkout/` | `value`, `currency`, `items`, `coupon` | Evaluates checkout drop-off rate |
| `view_item` | User visits individual event product page | `item_id`, `item_name`, `item_category` (`Events`, `Retreats`, `Shop`) | Product interest intent |
| `join_waitlist` | MetForm (ID 6697) submission on sold-out events | `event_name`, `user_email_domain` | High-intent lead capture |
| `corporate_inquiry` | Submission on `/corporate-wellness/` form | `company_name`, `team_size`, `inquiry_type` | High-ticket B2B pipeline |
| `quiz_completed` | Completion of Diagnostic Quiz (when live) | `quiz_result_type`, `score` | Somatic lead generation |

---

## 2. GTM / DataLayer Snippet for WooCommerce Checkout

Add to `functions.php` or Header Snippets:

```php
/**
 * Push WooCommerce Purchase DataLayer Event to GA4
 */
add_action('woocommerce_thankyou', 'stillness_ga4_purchase_datalayer', 20);
function stillness_ga4_purchase_datalayer($order_id) {
    if (!$order_id) return;
    $order = wc_get_order($order_id);
    if (!$order) return;

    $items = [];
    foreach ($order->get_items() as $item_id => $item) {
        $product = $item->get_product();
        $items[] = [
            'item_id' => (string)$item->get_product_id(),
            'item_name' => $item->get_name(),
            'price' => (float)$product->get_price(),
            'quantity' => (int)$item->get_quantity(),
        ];
    }
    ?>
    <script>
    window.dataLayer = window.dataLayer || [];
    dataLayer.push({
        event: 'purchase',
        ecommerce: {
            transaction_id: '<?php echo esc_js($order->get_order_number()); ?>',
            value: <?php echo (float)$order->get_total(); ?>,
            currency: '<?php echo esc_js($order->get_currency()); ?>',
            items: <?php echo json_encode($items); ?>
        }
    });
    </script>
    <?php
}
```

---

## 3. GA4 Custom Audiences

1. **High-Intent Local Attendees**: Users who viewed `/events/` > 2 times in 14 days but have not fired `purchase`.
2. **Retreat Applicants**: Users who spent > 90 seconds on `/hawaii-retreat/`.
3. **Corporate Decision Makers**: Users visiting `/corporate-wellness/`.
