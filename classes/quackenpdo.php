<?php
class QuackenPDO extends PDO {
  private $id;
  private $token;
  private $ip;
  private $lobby;

  public function __construct(int $id, string $token, string $ip) {
    $this->id = $id;
    $this->token = $token;
    $this->ip = $ip;

    parent::__construct('mysql:dbname=krakenhunt;host=localhost', 'root', '',
        array(PDO::ATTR_PERSISTENT => true,
              PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_NUM));
  }

  public function setLobby(string $lobby) {
    $this->lobby = $lobby;
    return $this;
  }

  function removeGhosts() {
  	$ghosts = $this->query("SELECT UserName, ID FROM $this->lobby
  			WHERE UNIX_TIMESTAMP(Timestamp) < (UNIX_TIMESTAMP() - 10)");

  	while ($row = $ghosts->fetch()) {
  		$u = $row[0];
  		$id = $row[1];
  		$this->exec("DELETE FROM $this->lobby WHERE ID = $id");
  		$this->exec("INSERT INTO chat (Name, Message, Type)
  				VALUES ('$u', '< $id', 'note')");
  	}
    return $this;
  }

  public function getLobbyUser(string $columns) {
    $sth = $this->prepare("SELECT $columns FROM $this->lobby WHERE
        ID = ? AND Token = ? AND IP = '$this->ip' LIMIT 1");
    $sth->execute(array( $this->id, $this->token ));
    return $sth->fetch(PDO::FETCH_ASSOC);
  }

  public function getNewChat(int $index) {
    return $this->query("SELECT Name, Message, Type FROM chat
        WHERE ID > $index")->fetchAll();
  }

  public function updateLobbyUser(array $keyValues) {
    $sqlString = $this->getUpdateString($keyValues);
    $this->exec("UPDATE $this->lobby SET Timestamp = now(), $sqlString
        WHERE ID = $this->id");
  }

  private function getUpdateString(array $keyValues) {
    foreach ($keyValues as $key => $value) {
      $sqlArray[] = "$key='$value'";
    }
    return join(', ', $sqlArray);
  }
}
?>
