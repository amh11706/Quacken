<?php
$conn = new PDO('mysql:dbname=krakenhunt;host=localhost', 'root', '', array(PDO::ATTR_PERSISTENT => true));

$result = $conn->query("SELECT Data FROM maps WHERE ID = 1");

if ($result) {
    $row = $result->fetch()[0];
    echo $row;
} else {
    echo "0 results";
}
?>
