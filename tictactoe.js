"use strict";

/* 
 * Player1: pc
 * Player2: user
 */

let field = init_game(3,3);
let container = document.querySelector("#game-container");
pc_move( field );
draw_field( container, field );
container.addEventListener(
	"click",
	function(event) {
		player_move( event, field );
	}
);


/*****************************/
/* high level functions      */
/*****************************/

/* returns an array of rows:
 * 0: empty field
 * 1: player 1
 * 2: player 2
*/
function init_game(width, height) {
	// an array of rows
	let field = [];
	for( let row_i=0; row_i<height; row_i++ ) {
		let row = [];
		for( let cell_i=0; cell_i<height; cell_i++ ) {
			row.push( 0 );
		}
		field.push( row );
	}
	return field;
}

function player_move( event, field) {
	// player 2 moves (human player):
	let game_pos = screen_pos_to_game_pos(
		field,
		event.target.width, event.target.height,
		event.offsetX, event.offsetY
	);
	let
		game_pos_x = game_pos[0],
		game_pos_y = game_pos[1]
	;
	if( field[game_pos_y][game_pos_x] == 0 ) {
		field[game_pos_y][game_pos_x] = 2;
	}
	else {
		return;
	}
	draw_field( event.target, field );
	{
		let game_state = is_game_over( field );
		draw_game_over(
			event.target,
			field,
			game_state
		);
	}
	// player 1 moves (pc):
	pc_move( field );
	draw_field( event.target, field );
	{
		let game_state = is_game_over( field );
		draw_game_over(
			event.target,
			field,
			game_state
		);
	}
}

function pc_move( field ) {
	// 1. try to win:
	{
		let play_pos = scan_lines(
			field,
			function( line ) {
				let player_1_counter = 0;
				let player_2_counter = 0;
				for( let cell of line ) {
					if( cell.value == 1 ) {
						player_1_counter++;
					}
					else if( cell.value == 2 ) {
						player_2_counter++;
					}
				}
				if( player_1_counter == 2 && player_2_counter == 0 ) {
					let play_pos = line.find(
						function(cell) {
							return cell.value == 0;
						}
					);
					return play_pos;
				}
				return 0;
			},
			null
		);
		if( play_pos != null ) {
			console.log("try to win");
			field[ play_pos.pos[0] ][ play_pos.pos[1] ] = 1;
			return;
		}
	}

	// 2. prevent opponent from winning:
	{
		let play_pos = scan_lines(
			field,
			function( line ) {
				let player_1_counter = 0;
				let player_2_counter = 0;
				for( let cell of line ) {
					if( cell.value == 1 ) {
						player_1_counter++;
					}
					else if( cell.value == 2 ) {
						player_2_counter++;
					}
				}
				if( player_2_counter == 2 && player_1_counter == 0 ) {
					let play_pos = line.find(
						function(cell) {
							return cell.value == 0;
						}
					);
					return play_pos;
				}
				return 0;
			},
			null
		);
		if( play_pos != null ) {
			console.log("prevent opponent from winning!");
			field[ play_pos.pos[0] ][ play_pos.pos[1] ] = 1;
			return;
		}
	}

	// 3. try to play in some corner:
	let free_corners = [];
	let occupied_corners = [];
	if( field[0][0] == 0 ) {
		free_corners.push( [0,0] );
	}
	else if( field[0][0] != 0 ) {
		occupied_corners.push( [0,0] );
	}
	if( field[0][2] == 0 ) {
		free_corners.push( [0,2] );
	}
	else if( field[0][2] != 0 ) {
		occupied_corners.push( [0,2] );
	}
	if( field[2][0] == 0 ) {
		free_corners.push( [2,0] );
	}
	else if( field[2][0] != 0 ) {
		occupied_corners.push( [2,0] );
	}
	if( field[2][2] == 0 ) {
		free_corners.push( [2,2] );
	}
	else if( field[2][2] != 0 ) {
		occupied_corners.push( [2,2] );
	}
	// 3.1. play diagonal corner:
	if( occupied_corners.length == 1 ) {
		console.log("play diagonal corner");
		field[ 2-occupied_corners[0][0] ][ 2-occupied_corners[0][1] ] = 1;
		return;
	}
	// 3.2. play any corner:
	if( free_corners.length > 0 ) {
		console.log("play in corner");
		let r = Math.floor( Math.random() * free_corners.length );
		let corner = free_corners[r];
		field[ corner[0] ][ corner[1] ] = 1;
		return;
	}
	// this should never happen:
	console.log( "no strategy found! ");
}

function is_game_over( field ) {
	let winner = scan_lines(
		field,
		function( line ) {
			let player_1_counter = 0;
			let player_2_counter = 0;
			for( let cell of line ) {
				if( cell.value == 1 ) {
					player_1_counter++;
				}
				else if( cell.value == 2 ) {
					player_2_counter++;
				}
			}
			if( player_1_counter >= 3 ) {
				return 1;
			}
			else if( player_2_counter >= 3 ) {
				return 2;
			}
			return 0;
		}
	);
	if( winner != 0 ) {
		return winner;
	}
	// no one has won, but game finished?
	let field_full = true;
	for( let row of field ) {
		for( let cell of row ) {
			if( cell == 0 )
				field_full = false;
		}
	}
	if( field_full ) {
		return 3;
	}
	return 0;
}

// draw game onto a canvas element
function draw_field( el, field ) {
	if (!el.getContext) {
		return;
	}
	let field_size = field_get_size( field );
	let
		width = el.width,
		height = el.height,
		cell_width = width / field_size.col_count,
		cell_height = height / field_size.row_count,
		ctx = el.getContext('2d')
	;

	ctx.fillStyle = "white";
	ctx.strokeStyle = "#000";
	ctx.lineWidth = 5;
	for( let row_i=0; row_i<field_size.row_count; row_i++ ) {
		ctx.moveTo(
			0, cell_height * (row_i+1)
		);
		ctx.lineTo(
			width, cell_height * (row_i+1)
		);
		ctx.stroke();
	}
	for( let col_i=0; col_i<field_size.col_count; col_i++ ) {
		ctx.moveTo(
			cell_width * (col_i+1), 0
		);
		ctx.lineTo(
			cell_width * (col_i+1), height
		);
		ctx.stroke();
	}
	let border_width = cell_width * 0.1;
	let border_height = cell_height * 0.1;
	for( let row_i=0; row_i<field_size.row_count; row_i++ ) {
		for( let col_i=0; col_i<field_size.col_count; col_i++ ) {
			switch( field[row_i][col_i] ) {
				case 1:
					draw_cross(
						ctx,
						cell_width*col_i + border_width,
						cell_height*row_i + border_height,
						cell_width - 2*border_width,
						cell_height - 2*border_height
					);
				break;
				case 2:
					draw_circle(
						ctx,
						cell_width*col_i + border_width,
						cell_height*row_i + border_height,
						cell_width - 2*border_width,
						cell_height - 2*border_height
					);
				break;
			}
		}
	}
}

// depending on the game state - draw text message
function draw_game_over(
	el,
	field,
	game_state
) {
	let text = null;
	switch( game_state ) {
		case 1:
			text = "YOU LOOSE!";
		break;
		case 2:
			text = "YOU WIN!";
		break;
		case 3:
			text = "GAME OVER";
		break;
	};
	if( text != null ) {
		draw_text(
			el,
			text
		);
	}
}

/*****************************/
/* draw utilities            */
/*****************************/

// draw text
function draw_text(
	el,
	text
) {
	if (!el.getContext) {
		return;
	}
	let
		width = el.width,
		height = el.height,
		ctx = el.getContext('2d')
	;
	ctx.font = "48px Arial";
	ctx.textAlign = "center";
	ctx.fillStyle = "red";
	ctx.fillText(
		text,
		width/2,
		height/2
	);
}

function draw_cross(
	ctx,
	x, y,
	width, height
) {
	ctx.strokeStyle = "#000";
	ctx.moveTo(
		x, y
	);
	ctx.lineTo(
		x+width, y+height
	);
	ctx.stroke();

	ctx.moveTo(
		x+width, y
	);
	ctx.lineTo(
		x, y+height
	);
	ctx.stroke();
}

function draw_circle(
	ctx,
	x, y,
	width, height
) {
	ctx.strokeStyle = "#000";
	ctx.beginPath();
	ctx.arc(
		x+width/2, y+height/2,
		Math.min(width/2, height/2),
		0,
		2 * Math.PI
	);
	ctx.stroke();
}

/*****************************/
/* field utilities           */
/*****************************/

function field_get_size( field ) {
	let
		row_count = field.length;
	let col_count = 0;
	if( row_count > 0 ) {
		col_count = field[0].length
	}
	return {
		row_count: row_count,
		col_count: col_count
	};
}

/* apply a function 'func'
 * to every row, column and diagonal
 * as soon as 'func' returns != 0, return the result
 */
function scan_lines(
	field,
	func,
	default_return = 0
) {
	// check rows:
	for( let row_i=0; row_i<3; row_i++ ) {
		let line_content = []
		for( let col_i=0; col_i<3; col_i++ ) {
			let current_field = field[row_i][col_i];
			line_content.push( {
				pos: [row_i, col_i],
				value: current_field
			});
		}
		let row_res = func(
			line_content
		);
		if( row_res ) {
			return row_res;
		}
	}
	// check cols:
	for( let col_i=0; col_i<3; col_i++ ) {
		let line_content = []
		for( let row_i=0; row_i<3; row_i++ ) {
			let current_field = field[row_i][col_i];
			line_content.push( {
				pos: [row_i, col_i],
				value: current_field
			});
		}
		let row_res = func(
			line_content
		);
		if( row_res ) {
			return row_res;
		}
	}
	let diag_ret = scan_diagonals(
		field,
		func,
		default_return
	);
	if( diag_ret ) {
		return diag_ret
	}
	return default_return;
}

/* apply a function 'func'
 * to every diagonal
 * as soon as 'func' returns != 0, return the result
 */
function scan_diagonals(
	field,
	func,
	default_return = 0
) {
	// check diagonal:
	// \
	//  \
	//   \
	{
		let line_content = []
		for( let row_i=0; row_i < 3; row_i++ ) {
			let col_i = row_i;
			let current_field = field[row_i][col_i];
			line_content.push( {
				pos: [row_i, col_i],
				value: current_field
			});
		}
		let row_res = func(
			line_content
		);
		if( row_res ) {
			return row_res;
		}
	}
	// check diagonal:
	//   /
	//  /
	// /
	{
		let line_content = []
		for( let row_i=0; row_i < 3; row_i++ ) {
			let col_i = 2-row_i;
			let current_field = field[row_i][col_i];
			line_content.push( {
				pos: [row_i, col_i],
				value: current_field
			});
		}
		let row_res = func(
			line_content
		);
		if( row_res ) {
			return row_res;
		}
	}
	return default_return;
}

function screen_pos_to_game_pos(
	field,
	width, height,
	x, y
) {
	let field_size = field_get_size( field );
	let
		cell_width = width / field_size.col_count,
		cell_height = height / field_size.row_count
	;
	let
		game_pos_x = Math.floor( x / cell_width ),
		game_pos_y = Math.floor( y / cell_height )
	;
	return [game_pos_x, game_pos_y];
}
