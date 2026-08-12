insert into departments (name, description) values
  ('Roads & Highways', 'Potholes, damaged roads, and general road infrastructure'),
  ('Sanitation & Waste Management', 'Overflowing bins and waste collection issues'),
  ('Water & Drainage', 'Drainage blockages and flooding-related infrastructure'),
  ('Electricity & Streetlighting', 'Broken or non-functional streetlights')
on conflict (name) do nothing;
