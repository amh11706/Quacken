<?php
class Boat {
	private $ID;
	private $UserName;
	private $Moves; 	// a string of 4 moves, 0123 meaning sit, left, forward, and right respectively
	private $X;
	private $Y;
	private $Face;		// boat face direction, 0123 meaning up, right, down, and left respectively
	private $Damage;
	private $Treasure;
	private $SpawnTurn;
	private $tryMove;
	private $tryX;
	private $tryY;
	private $tryFace;
	private $crunchDir;
	private $crunchDamage;
	private $inSZ = false;
	private $moveLock = false;

	public function __construct() {
		$this->ID = (int)$this->ID;
		$this->X = (int)$this->X;
		$this->Y = (int)$this->Y;
		$this->tryX = $this->X;
		$this->tryY = $this->Y;
		$this->Face = (int)$this->Face;
		$this->Treasure = (int)$this->Treasure;
	}

	public function getID() {
		return $this->ID;
	}

	public function getMove(int $step) {
		return (int)$this->Moves[$step];
	}

	public function getTryMove() {
		return $this->tryMove;
	}

	public function setTryMove(int $move) {
		if ($this->moveLock) return $this;
		$this->tryMove = $move;
		return $this;
	}

	public function getFace() {
		return $this->Face;
	}

	public function getTryFace() {
		return $this->tryFace;
	}

	public function setTryFace(int $face) {
		$this->tryFace = $face;
		return $this;
	}

	public function getX() {
		return $this->X;
	}

	public function getY() {
		return $this->Y;
	}

	public function setPos(int $x, int $y) {
		$this->X = $x;
		$this->Y = $y;
		return $this;
	}

	public function getTryX() {
		return $this->tryX;
	}

	public function getTryY() {
		return $this->tryY;
	}

	public function setTryPos(int $x, int $y) {
		$this->tryX = $x;
		$this->tryY = $y;
		return $this;
	}

	public function getRotation() {
		return $this->Face;
	}

	public function rotateByMove(int $move) {
		if ($this->moveLock) return;
		$this->Face = ($this->Face + $move + 2) % 4;
		$this->tryFace = ($this->tryFace + $move + 2) % 4;
		return $this;
	}

	public function hitTile(int $tile) {
		if ($tile > 12) {
			$this->crunch(1);
			return $this;
		} else if ($tile > $this->Treasure && $tile < 5) {
			$this->Treasure = $tile;
		}
		return $this;
	}

	public function crunch(int $damage, int $direction = null) {
		if (empty( $direction )) $direction = $this->tryFace;
		$this->crunchDir = $direction;
		$this->Damage += $damage;
		$this->crunchDamage = $damage;

		if ($this->Damage >= 3) $this->sink();
		return $this;
	}

	public function getSpawnTurn() {
		return $this->SpawnTurn;
	}

	public function setSpawnTurn(int $turn) {
		$this->SpawnTurn = $turn;
		return $this;
	}

	public function getInSZ() {
		return $this->inSZ;
	}

	public function setInSZ(bool $inSZ = true) {
		$this->inSZ = $inSZ;
		return $this;
	}

	public function enterSZ() {
		$loadedTreasure = $this->Treasure;
		$this->sink();
		return array($this->ID, $this->UserName, $loadedTreasure, $this->SpawnTurn);
	}

	public function sink() {
		$this->moveLock = true;
		$this->Damage = 0;
		$this->Treasure = 0;
		$this->Face = 0;
	}

	public function getMoveLock() {
		return $this->moveLock;
	}

	public function fetchStatus() {
		$response = array($this->ID, $this->tryFace, $this->tryMove, $this->X, $this->Y, $this->Treasure);
		$this->tryMove = 0;
		$this->tryX = $this->X;
		$this->tryY = $this->Y;

		if (isset( $this->crunchDir )) {
			$response[] = $this->crunchDir;
			$response[] = $this->crunchDamage;
			unset($this->crunchDir);
		}

		return $response;
	}

	public function getBoatSync() {
		return array($this->ID, $this->Face, $this->X, $this->Y, $this->Treasure, (int)$this->Damage);
	}

	public function getDBVars() {
		return array($this->X, $this->Y, $this->Face, $this->Damage, $this->Treasure, $this->SpawnTurn, $this->ID);
	}
}
?>
