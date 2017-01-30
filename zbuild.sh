until gulp; do
    echo "Gulp crashed... with exit code $?.  Respawning.." >&2
    sleep 2
done