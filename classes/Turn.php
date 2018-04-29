<?php
class Turn {
	private $decodeX = array(0, 1, 0, -1);
	private $decodeY = array(-1, 0, 1, 0);
	private $Map;
	private $map;
	private $mapHeight;
	private $mapWidth;
	private $boatMap;
	private $boatTryMap;
	private $Turn;
	private $boats;
	private $turnArray;
	private $chatBuffer;
	private $TreasureString;

	public function __construct() {
		$this->map = json_decode($this->Map);
		unset($this->Map);
		$this->mapHeight = count($this->map);
		$this->mapWidth = count($this->map[0]);
	}

	public function insertBoats(array $boats) {
		$this->boats = $boats;

		foreach ($boats as $boat) {
			$x = $boat->getX();
			$y = $boat->getY();
			$this->boatMap[$y][$x] = $boat;

			if (
				$y > $this->mapHeight - 4 && $y < $this->mapHeight
				&& $x >= 0 && $x < $this->mapWidth
			) {
				$boat->setInSZ();
			}
		}

		return $this;
	}

	public function getTurn() {
		return $this->Turn;
	}

	public function doTurn() {
		$this->Turn++;

		for ($step = 0; $step < 4; $step++) {
			$turnArray[] = $this->doMoveStep(true, $step);

			$turnArray[] = $this->doMoveStep(false);
		}

		if ($this->Turn === 90) {
			foreach ($this->boats as $boat) {
				$boat->sink();
			}

			$this->Turn = 0;
			unset($this->boatMap);
		}

		$turnArray[] = $this->syncAndRespawn();
		$this->turnString = json_encode($turnArray);

		return $this->turnString;
	}

	private function doMoveStep(bool $isBoatMove, int $step = 0) {
		$movingBoats = $this->setTryMoves($this->boats, $isBoatMove, $step);

		if (is_null( $movingBoats )) return array();

		$turningBoats = $this->moveHalfStep($movingBoats, $isBoatMove, true);
		$this->rotateBoats($movingBoats);

		if (is_array( $turningBoats )) $this->moveHalfStep($turningBoats, $isBoatMove);

		$this->checkAndEnterSZ();
		return $this->getBoatsArray();
	}

	private function setTryMoves(array &$boats, bool $isBoatMove, int $step) {
		foreach ($boats as $boat) {
			if ($boat->getMoveLock()) continue;

			if ($isBoatMove) {
				$move = $boat->getMove($step);
				$face = $boat->getFace();
			} else {
				$obstacle = $this->getMapTile($boat->getX(), $boat->getY());
				if ($obstacle < 0) $obstacle = -$obstacle;

				$move = 0;
				if ($obstacle > 8) $move = 3;
				else if ($obstacle > 4) $move = 2;

				$face = ($obstacle + 3) % 4;
			}

			$boat->setTryMove($move);
			$boat->setTryFace($face);
			if ($move) $movingBoats[] = $boat;
		}
		if (isset( $movingBoats )) return $movingBoats;
	}

	private function moveHalfStep(array &$boats, bool $isBoatMove, bool $allowPush = false) {
		$this->setTryTiles($boats);

		$this->checkAndPush($boats, $allowPush);

		return $this->commitMoves($boats, $isBoatMove);
	}

	private function rotateBoats(array &$boats) {
		foreach ($boats as $boat) {
			if (( $move = $boat->getTryMove() ) === 2) continue;
			$boat->rotateByMove($move);
		}
	}

	private function checkAndEnterSZ() {
		foreach ($this->boats as $boat) {
			if (!$boat->getTryMove()) continue;
			$inSZ = $boat->getInSZ();
			$x = $boat->getX();
			$y = $boat->getY();

			if ($y > $this->mapHeight - 4 && $y < $this->mapHeight && $x >= 0 && $x < $this->mapWidth) {
				if (!$inSZ) {
					$this->chatBuffer[] = $boat->enterSZ();
					unset($this->boatMap[$y][$x]);
				}
			} else if ($inSZ) $boat->setInSZ(false)->setSpawnTurn($this->Turn - 1);
		}
	}

	private function setTryTiles(array &$boats) {
		foreach ($boats as $boat) {
			$x = $boat->getX();
			$y = $boat->getY();
			$direction = $boat->getTryFace();
			$tryX = $x + $this->decodeX[$direction];
			$tryY = $y + $this->decodeY[$direction];
			$boat->setTryPos($tryX, $tryY);

			$tile = $this->getMapTile($tryX, $tryY);
			$boat->hitTile($tile);

			if ($tile > 12) {
				$this->blockTile($x, $y);
				$boat->setTryPos($x, $y);

			} else if ($this->blockTile( $tryX, $tryY )) {
				$boat->crunch(0, $direction);
				$this->blockTile($x, $y);

			} else {
				$this->boatTryMap[$tryY][$tryX] = $boat;
			}
		}
	}

	private function checkAndPush(array &$boats, bool $allowPush) {
		foreach ($boats as $boat) {
			$tryX = $boat->getTryX();
			$tryY = $boat->getTryY();
			if ($this->boatTryMap[$tryY][$tryX] !== $boat ||
					!isset( $this->boatMap[$tryY][$tryX] )) continue;

			$blockedBy = $this->boatMap[$tryY][$tryX];
			$blockX = $blockedBy->getTryX();
			$blockY = $blockedBy->getTryY();
			$x = $boat->getX();
			$y = $boat->getY();
			$sitting = ($blockX === $tryX && $blockY === $tryY);

			if ($sitting || ( $blockX === $x && $blockY === $y)) {
				$this->blockTile($tryX, $tryY);
			}

			if (!$sitting || $boat->getTryMove() !== 2 || !$allowPush) continue;

			$dir = $boat->getTryFace();

			while (true) {
				$tryX += $this->decodeX[$dir];
				$tryY += $this->decodeY[$dir];

				if ($this->blockTile( $tryX, $tryY )) continue 2;

				if (!isset( $this->boatMap[$tryY][$tryX] )) break;
				$pushBoat = $this->boatMap[$tryY][$tryX];

				if ($pushBoat->getTryMove()) break;

				$blockedBy = $pushBoat;
			}

			if ($this->getMapTile($tryX, $tryY) < 13) {
				$blockedBy->setTryPos($tryX, $tryY);
				$blockedBy->setTryMove(2);
				$blockedBy->setTryFace($dir);
				$this->boatTryMap[$tryY][$tryX] = $blockedBy;
				$boats[] = $blockedBy;
			}
		}
	}

	private function commitMoves(array &$boats, bool $isBoatMove) {
		foreach ($boats as $boat) {
			$tryX = $boat->getTryX();
			$tryY = $boat->getTryY();
			if ($this->boatTryMap[$tryY][$tryX] !== $boat) continue;

			unset($this->boatMap[$boat->getY()][$boat->getX()]);
			$boat->setPos($tryX, $tryY);
			$this->boatMap[$tryY][$tryX] = $boat;

			if ($boat->getTryMove() !== 2) $turningBoats[] = $boat;

			else if (!$isBoatMove) {
				$obstacle = $this->getMapTile($tryX, $tryY);
				if ($obstacle < 0 && $boat->getTryFace() === -$obstacle - 5) $turningBoats[] = $boat;
			}
		}

		unset($this->boatTryMap);
		if (isset( $turningBoats )) return $turningBoats;
	}

	private function blockTile(int $x, int $y) {
		if (!isset( $this->boatTryMap[$y][$x] )) {
			$this->boatTryMap[$y][$x] = false;
			return false;
		}

		while (true) {
			$boat = isset($this->boatTryMap[$y][$x]) ? $this->boatTryMap[$y][$x] : false;
			$this->boatTryMap[$y][$x] = false;
			if (!$boat) return true;

			$boat->crunch(0);
			$x = $boat->getX();
			$y = $boat->getY();
			$boat->setTryPos($x, $y);
		}
	}

	private function getMapTile(int $x, int $y) {
		$tile = 0;
		if ($x < 0) $tile = -6;
		else if ($x >= $this->mapWidth) $tile = -8;

		if ($y < 0) $tile -= 7;
		else if ($y >= $this->mapHeight) $tile -= 5;

		if ($tile < -10) return 13;
		return $tile ? $tile : $this->map[$y][$x];
	}

	private function getBoatsArray() {
		foreach ($this->boats as $boat) {
			if (!$boat->getTryMove()) continue;
			$boatStatus[] = $boat->fetchStatus();
		}
		return $boatStatus;
	}

	private function syncAndRespawn() {
		$x = 12;
		$xshift = 2;
		$try = 1;

		foreach ($this->boats as $boat) {
			if ($boat->getMoveLock()) {
				do {
					$blocked = false;
					if (isset( $this->boatMap[49][$x] ) || isset( $this->boatMap[48][$x] )) {
						$blocked = true;
						$x += $xshift * $try;
						$xshift += 2;
						$try = -$try;
					}
				} while ($blocked);

				$boat->setPos($x, 49);

				$x += $xshift * $try;
				$xshift += 2;
				$try = -$try;
			}
			$boatSync[] = $boat->getBoatSync();
		}
		return $boatSync;
	}

	public function updateDB(PDO $conn) {
		$sth = $conn->prepare("UPDATE lobby1 SET X = ?, Y = ?, Face = ?, Damage = ?,
							   Treasure = ?, SpawnTurn = ? WHERE ID = ? LIMIT 1");
		foreach ($this->boats as $boat) {
			$sth->execute( $boat->getDBVars() );
		}

		$conn->exec("UPDATE lobby1 SET Idle = 1 WHERE Moves = '0000'");

		$conn->exec("UPDATE lobbies SET Turn = $this->Turn, TurnString = '$this->turnString',
					 TreasureString = '$this->TreasureString', TurnActive = 0");
	}

	public function updateTreasure(PDO $conn) {

		if (!empty( $this->chatBuffer )) {
			$loaded = array('', 'Cuttle Cake', 'Taco Locker', 'Pea Pod', 'Fried Egg');
			$treasureArray = json_decode($this->TreasureString);

			$sth = $conn->prepare("INSERT INTO chat (Message, Type) VALUES (?, 'load')");

			foreach ($this->chatBuffer as $treasure) {
				if (!$treasure[2]) continue;

				$treasureArray[$treasure[2] - 1]++;

				$turns = $this->Turn - $treasure[3];
				if ($turns < 0) $turns += 90;

				$seconds = ($turns % 3) * 20;
				if (!$seconds) $seconds = '00';
				$timeString = (int)($turns / 3) . ':' . $seconds;

				$message = $treasure[1] . ' loaded a ' . $loaded[$treasure[2]] . ' in ' .
					$turns . ' turns (' . $timeString . ').';
				$sth->execute(array( $message ));
			}

			$this->TreasureString = json_encode($treasureArray);
		}

		if ($this->Turn === 0) {
			$conn->exec("INSERT INTO chat (Message, Type) VALUES ('$this->TreasureString', 'tres')");
			$this->TreasureString = '[0,0,0,0]';
		}

		return $this->TreasureString;
	}
}
?>
