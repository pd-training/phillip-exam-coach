SELECT 
  u.id, u.email,
  sp.id as sp_id, sp."paperId", sp.status,
  p.title
FROM "User" u
LEFT JOIN "StudentPaper" sp ON u.id = sp."userId"
LEFT JOIN "Paper" p ON sp."paperId" = p.id
WHERE u.email = 'student@phillip.com'
ORDER BY u.id, sp.id;
