<?php
/* =========================
   CONEXIÓN SEVIDOR
========================= */
// $conexion = mysqli_connect("sql304.infinityfree.com", "if0_40409201","afrg2822afrg","if0_40409201_aima") or exit ("No se pudo conectar a la base de datos.");
 
/* =========================
   CONEXIÓN LOCAL
========================= */
 $conexion = mysqli_connect("localhost", "root","","cursoutn");

if (!$conexion) { 
	exit("No se pudo conectar a la base de datos");
	};

