Terminology:
  * bg: background.js
  * h: hook (may be specific to page)
  * s: server
  * p: popup_xxx.html (visual part of ext)
  
Messages:
  vs_prices: h -> bg // when the user does a search and I've gotten prices
  vs_column: bg -> p // when bg has new price column for the p
  vs_column_rebroadcast: p -> bg // when p is opened and needs new data
  
Typical order:
*  bg: detect compatible page, inject hook
!  h: detect prices;calculate it; message bg: vs_prices include random unique search_id
  bg: 
*    store vs_prices by tab; 
    s:launch comparison (client_id:search_id); 
*    set p:popup_found.html; 
*    Light up found_icon;  
*    transmit p:vs_column
    
  s: return cryptographically secure client_id if one isn't included that you already know about

*  p: startup: detect current tab; bg:vs_column_rebroadcast
*  bg: on vs_column_rebroadcast, retransmit p:vs_column all unique pricing for tab's current search _id,  
  s: comparison callback; bg:transmit for p:vs_column  
  