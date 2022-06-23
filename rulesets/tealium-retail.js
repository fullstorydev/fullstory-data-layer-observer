window['_dlo_rules_tealium_retail'] = [
  {
    id: "fs-tealium-event",
    source: "utag.data[^(brand_,browse_,cart_,category_,customer_,language_,page_,product_,order_,search_,site_,tealium_event)]",
    operators: [
      { name: "query", select: "$[?(tealium_event)]" },
      { name: "query", select: "$[!(customer_email,customer_first_name,customer_last_name)]" },
      { name: "insert", select: "tealium_event" }
    ],
    destination: "FS.event"
  }
];