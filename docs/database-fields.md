Lean MVP Fields

Because all fridges are 50L, no need to over-model.

Listing Fields
id
listing_code
category
brand
condition
location
capacity_litres
buy_enabled
buy_price
rent_enabled
rent_price
deposit_price
delivery_available
delivery_price
status
admin_note
created_at
updated_at

Defaults:

category = fridge
capacity_litres = 50
rent_price = 70
deposit_price = 40
delivery_available = true
delivery_price = 15
status = available
Image Fields
id
listing_id
image_url
sort_order
created_at
Action History Fields
id
listing_id
action_type
old_value
new_value
note
performed_by
created_at