export default function (err, req, res, next) {
  console.error(err);

  res.status(400).json({ error: err.message });
}
