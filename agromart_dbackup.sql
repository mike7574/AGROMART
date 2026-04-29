-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: agri_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_user_product` (`user_id`,`product_id`),
  KEY `idx_cart_user_id` (`user_id`),
  KEY `idx_cart_product_id` (`product_id`),
  CONSTRAINT `fk_cart_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (1,1,1,1,'2026-04-26 02:06:18','2026-04-26 02:06:18',NULL,'2026-04-26 09:59:11'),(2,2,2,3,'2026-04-26 02:21:49','2026-04-26 02:25:07',NULL,'2026-04-26 09:59:11'),(3,2,1,1,'2026-04-26 02:25:02','2026-04-26 02:25:02',NULL,'2026-04-26 09:59:11'),(30,4,2,2,'2026-04-26 15:10:26','2026-04-26 15:10:26',NULL,'2026-04-26 15:10:26');
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int unsigned NOT NULL DEFAULT '100',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Fertilizers','fertilizers','Organic and inorganic fertilizers for healthy crops.',10,1,'2026-04-26 00:58:13','2026-04-26 00:58:13',NULL),(2,'Livestock','livestock',NULL,100,1,'2026-04-26 01:59:21','2026-04-26 01:59:21',NULL),(3,'Pesticides & Herbicides','pesticides-herbicides',NULL,100,1,'2026-04-26 12:50:32','2026-04-26 12:50:32',NULL),(4,'Animal Feed','animal-feed',NULL,100,1,'2026-04-26 13:11:36','2026-04-26 13:11:36',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `line_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,3,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 10:08:55','2026-04-26 10:08:55',NULL),(2,4,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 10:12:08','2026-04-26 10:12:08',NULL),(3,5,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 10:47:27','2026-04-26 10:47:27',NULL),(4,6,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:01:52','2026-04-26 11:01:52',NULL),(5,7,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 11:03:59','2026-04-26 11:03:59',NULL),(6,8,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:09:13','2026-04-26 11:09:13',NULL),(7,9,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:12:11','2026-04-26 11:12:11',NULL),(8,10,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:33:04','2026-04-26 11:33:04',NULL),(9,11,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 11:39:03','2026-04-26 11:39:03',NULL),(10,12,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 11:43:49','2026-04-26 11:43:49',NULL),(11,12,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:43:49','2026-04-26 11:43:49',NULL),(12,13,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 11:48:42','2026-04-26 11:48:42',NULL),(13,14,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 11:51:11','2026-04-26 11:51:11',NULL),(14,15,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 12:01:44','2026-04-26 12:01:44',NULL),(15,16,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 12:11:00','2026-04-26 12:11:00',NULL),(16,17,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 12:29:04','2026-04-26 12:29:04',NULL),(17,18,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 12:34:01','2026-04-26 12:34:01',NULL),(18,19,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 12:36:50','2026-04-26 12:36:50',NULL),(19,20,2,'eggs',NULL,'unit',1,400.00,0.00,'2026-04-26 12:42:41','2026-04-26 12:42:41',NULL),(20,20,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 12:42:41','2026-04-26 12:42:41',NULL),(21,21,1,'Organic Fertilizer',NULL,'unit',1,1299.00,0.00,'2026-04-26 13:03:32','2026-04-26 13:03:32',NULL),(22,21,3,'Knapsack Sprayer (16L)',NULL,'unit',1,800.00,0.00,'2026-04-26 13:03:32','2026-04-26 13:03:32',NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `order_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `county` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','PROCESSING','FULFILLED','CANCELLED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `payment_status` enum('PENDING','COMPLETED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `customer_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_order_number` (`order_number`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`payment_status`),
  CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (3,3,'ORD-1777187335021-741','mike bosire','254791318109','kuria@gmail.com','Uasin Gishu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 10:08:55','2026-04-26 10:08:55',NULL),(4,3,'ORD-1777187528502-403','mike bosire','254791318109','kuria@gmail.com','Nakuru','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 10:12:08','2026-04-26 10:12:08',NULL),(5,3,'ORD-1777189647493-530','mike bosire','254791318109','kuria@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 10:47:27','2026-04-26 10:47:27',NULL),(6,3,'ORD-1777190512604-210','mike bosire','254791318109','kuria@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 11:01:52','2026-04-26 11:01:52',NULL),(7,3,'ORD-1777190639330-436','mike bosire','254791318109','kuria@gmail.com','Nairobi','kisii',NULL,1299.00,2500.00,3799.00,'PENDING','PENDING',NULL,'2026-04-26 11:03:59','2026-04-26 11:03:59',NULL),(8,3,'ORD-1777190953169-986','mike bosire','254791318109','kuria@gmail.com','Nakuru','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 11:09:13','2026-04-26 11:09:13',NULL),(9,3,'ORD-1777191131343-271','mike bosire','254791318109','kuria@gmail.com','Nakuru','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 11:12:11','2026-04-26 11:12:11',NULL),(10,3,'ORD-1777192384086-315','mike bosire','254791318109','kuria@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 11:33:04','2026-04-26 11:33:04',NULL),(11,4,'ORD-1777192743719-568','LINET AWINO','254791318109','awino@gmail.com','Mombasa','kisii',NULL,1299.00,2500.00,3799.00,'PENDING','PENDING',NULL,'2026-04-26 11:39:03','2026-04-26 11:39:03',NULL),(12,4,'ORD-1777193029116-670','LINET AWINO','0791519308','awino@gmail.com','Kiambu','kisii',NULL,1699.00,2500.00,4199.00,'PENDING','PENDING',NULL,'2026-04-26 11:43:49','2026-04-26 11:43:49',NULL),(13,4,'ORD-1777193322007-421','LINET AWINO','254791318109','awino@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 11:48:42','2026-04-26 11:48:42',NULL),(14,4,'ORD-1777193471677-463','LINET AWINO','0791519308','awino@gmail.com','Kiambu','kisii',NULL,1299.00,2500.00,3799.00,'PENDING','PENDING',NULL,'2026-04-26 11:51:11','2026-04-26 11:51:11',NULL),(15,4,'ORD-1777194104688-335','LINET AWINO','254791318109','awino@gmail.com','Nakuru','kisii',NULL,1299.00,2500.00,3799.00,'PENDING','PENDING',NULL,'2026-04-26 12:01:44','2026-04-26 12:01:44',NULL),(16,4,'ORD-1777194660980-597','mike bosire','0791519308','awino@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 12:11:00','2026-04-26 12:11:00',NULL),(17,4,'ORD-1777195744822-19','mike bosire','254791318109','awino@gmail.com','Kiambu','kisii',NULL,400.00,2500.00,2900.00,'PENDING','PENDING',NULL,'2026-04-26 12:29:04','2026-04-26 12:29:04',NULL),(18,4,'ORD-1777196041914-892','LINET AWINO','254791318109','awino@gmail.com','Nakuru','kisii',NULL,1299.00,2500.00,3799.00,'PENDING','PENDING',NULL,'2026-04-26 12:34:01','2026-04-26 12:34:01',NULL),(19,4,'ORD-1777196210290-692','mike bosire','254791318109','awino@gmail.com','Nakuru','kisii',NULL,1299.00,2500.00,3799.00,'PROCESSING','PENDING',NULL,'2026-04-26 12:36:50','2026-04-26 12:36:52',NULL),(20,4,'ORD-1777196561269-205','Linet Awino','254791318109','awino@gmail.com','Nakuru','kisii',NULL,1699.00,2500.00,4199.00,'PROCESSING','PENDING',NULL,'2026-04-26 12:42:41','2026-04-26 12:42:49',NULL),(21,4,'ORD-1777197812355-645','Linet Awino','254791318109','awino@gmail.com','Nakuru','kisii',NULL,2099.00,2500.00,4599.00,'PROCESSING','PENDING',NULL,'2026-04-26 13:03:32','2026-04-26 13:03:34',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_type` enum('STK_PUSH','MPESA_CHECKOUT','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STK_PUSH',
  `status` enum('PENDING','COMPLETED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `mpesa_request_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `merchant_request_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkout_request_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mpesa_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mpesa_receipt_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mpesa_response_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_payload` json DEFAULT NULL,
  `callback_payload` json DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_payment_reference` (`payment_reference`),
  UNIQUE KEY `payment_id` (`payment_id`),
  UNIQUE KEY `uq_payments_checkout_request_id` (`checkout_request_id`),
  KEY `idx_payments_order_id` (`order_id`),
  KEY `idx_payments_user_id` (`user_id`),
  KEY `idx_payments_merchant_request_id` (`merchant_request_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payment_id` (`payment_id`),
  CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'25738a48-18b8-45bb-bc90-135ac93aefef',8,3,'25738a48-18b8-45bb-bc90-135ac93aefef',2900.00,'254791318109','STK_PUSH','PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:09:13','2026-04-26 11:09:13',NULL),(2,'ed6979c8-b5c9-4d7b-b98b-59042020575d',9,3,'ed6979c8-b5c9-4d7b-b98b-59042020575d',2900.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:12:11','2026-04-26 11:12:18',NULL),(3,'5acf7a5b-d767-4ed1-bd13-b5f6e9261bb6',10,3,'5acf7a5b-d767-4ed1-bd13-b5f6e9261bb6',2900.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:33:04','2026-04-26 11:33:06',NULL),(4,'1da67b7e-676d-413b-a3d5-ed4a4858f0b2',11,4,'1da67b7e-676d-413b-a3d5-ed4a4858f0b2',3799.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:39:03','2026-04-26 11:39:05',NULL),(5,'e179897f-e55d-4dc9-9d92-3e5c08f9e3d2',12,4,'e179897f-e55d-4dc9-9d92-3e5c08f9e3d2',4199.00,'254791519308','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:43:49','2026-04-26 11:43:52',NULL),(6,'a44aa698-5517-4d82-8cd0-4cd16a25ac51',13,4,'a44aa698-5517-4d82-8cd0-4cd16a25ac51',2900.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:48:42','2026-04-26 11:48:46',NULL),(7,'bc9727cb-0b63-4175-9795-83c6cc6c98c2',14,4,'bc9727cb-0b63-4175-9795-83c6cc6c98c2',3799.00,'254791519308','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 11:51:11','2026-04-26 11:51:12',NULL),(8,'d59c130d-0cdd-45ba-8182-d79d1f9fa7f3',15,4,'d59c130d-0cdd-45ba-8182-d79d1f9fa7f3',3799.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:01:44','2026-04-26 12:01:49',NULL),(9,'2b53b707-17b7-432f-a838-1b3bf916fca5',16,4,'2b53b707-17b7-432f-a838-1b3bf916fca5',2900.00,'254791519308','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:11:01','2026-04-26 12:11:02',NULL),(10,'4e865470-9f25-4e03-87ed-233d6d472bf8',17,4,'4e865470-9f25-4e03-87ed-233d6d472bf8',2900.00,'254791318109','STK_PUSH','FAILED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:29:04','2026-04-26 12:29:16',NULL),(11,'f4f23f46-bc71-4533-88bc-19d2434f017d',18,4,'f4f23f46-bc71-4533-88bc-19d2434f017d',3799.00,'254791318109','STK_PUSH','PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:34:01','2026-04-26 12:34:11',NULL),(12,'b22537c8-1091-4c6a-9f65-34e8674296a4',19,4,'b22537c8-1091-4c6a-9f65-34e8674296a4',3799.00,'254791318109','STK_PUSH','PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:36:50','2026-04-26 12:36:51',NULL),(13,'3f2f6f2f-96fa-4dd4-a826-54e10fec8836',20,4,'3f2f6f2f-96fa-4dd4-a826-54e10fec8836',4199.00,'254791318109','STK_PUSH','PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-26 12:42:41','2026-04-26 12:42:49',NULL),(14,'1a2ce7d3-d53c-4913-9829-5f30870acbfb',21,4,'1a2ce7d3-d53c-4913-9829-5f30870acbfb',4599.00,'254791318109','STK_PUSH','PENDING',NULL,'e55d-4519-86bb-379cf05dbfb49200','ws_CO_26042026130334222791318109',NULL,NULL,NULL,'0',NULL,NULL,NULL,'2026-04-26 13:03:32','2026-04-26 13:03:34',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `image_url` varchar(2083) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product_id` (`product_id`),
  KEY `idx_product_images_primary` (`product_id`,`is_primary`),
  CONSTRAINT `fk_product_images_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,3,'http://localhost:3000/uploads/products/product-1777197031922-820765356.jpg',NULL,0,1,'2026-04-26 12:50:32','2026-04-26 12:50:32',NULL),(3,2,'http://localhost:3000/uploads/products/product-1777197490347-103006404.jpeg',NULL,0,1,'2026-04-26 12:58:10','2026-04-26 12:58:10',NULL),(4,1,'http://localhost:3000/uploads/products/product-1777198296559-833315172.jpeg',NULL,0,1,'2026-04-26 13:11:36','2026-04-26 13:11:36',NULL),(5,4,'http://localhost:3000/uploads/products/product-1777198743345-186112687.jpeg',NULL,0,1,'2026-04-26 13:19:03','2026-04-26 13:19:03',NULL);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unit',
  `current_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `original_price` decimal(10,2) DEFAULT NULL,
  `stock` int unsigned NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int unsigned NOT NULL DEFAULT '100',
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  UNIQUE KEY `uq_products_sku` (`sku`),
  KEY `idx_products_category_id` (`category_id`),
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,4,'FERT-001','Organic Fertilizer','organic-fertilizer','Nourishing organic fertilizer for farms and gardens.','Rich organic fertilizer blended from natural compost and minerals to improve soil structure, enhance moisture retention, and nurture crops with slow-release nutrients. Ideal for vegetables, herbs, and field crops.','bag',1299.00,1500.00,100,1,1,70,NULL,'2026-04-26 00:58:13','2026-04-26 13:11:36',NULL),(2,2,'eg-001','eggs','eggs',NULL,'find fresh eggs wherever you are at affordable price','per create',400.00,450.00,29,0,1,60,NULL,'2026-04-26 01:59:21','2026-04-26 12:58:10',NULL),(3,3,'pee','Knapsack Sprayer (16L)','knapsack-sprayer-16l',NULL,'pesticide sprayer','500 ml',800.00,100.00,121,0,1,40,NULL,'2026-04-26 12:50:32','2026-04-26 12:50:32',NULL),(4,2,'SKU-002','Broiler Day-Old Chicks (100pcs)','broiler-day-old-chicks-100pcs',NULL,NULL,'per chick',100.00,150.00,700,0,1,80,NULL,'2026-04-26 13:19:03','2026-04-26 13:19:03',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT '0',
  `role` enum('CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'bosiremike@gmail.com','$2a$10$3YNb8e2FSyL6oQMdy/4rgOA2CbweywDWV7p4GaBJDQwOdi5TsEwUW','mike bosire',NULL,0,'CUSTOMER',NULL,'2026-04-26 02:05:34','2026-04-26 02:05:34',NULL),(2,'awinolin@gmail.com','$2a$10$yGI1/s42ZBGv9ING/4hScuHo4CbV3b1xBMwilMQLCscgE76LySJ0K','LINET AWINO',NULL,0,'CUSTOMER',NULL,'2026-04-26 02:19:05','2026-04-26 02:19:05',NULL),(3,'kuria@gmail.com','$2a$10$HFd43ymb9CfI0SyLn1lgCOOVZXWkWxcQVPjuBMDBScmdT5xNvjzGu','kamau kuria',NULL,0,'CUSTOMER',NULL,'2026-04-26 09:53:13','2026-04-26 09:53:13',NULL),(4,'awino@gmail.com','$2a$10$/GPb5aLoP4J51HPSfd.2out/j1sgDkGi7nH5M6kmdSq7eFqES1dxW','linet awino',NULL,0,'CUSTOMER',NULL,'2026-04-26 11:38:26','2026-04-26 11:38:26',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist_user_product` (`user_id`,`product_id`),
  KEY `idx_wishlist_user_id` (`user_id`),
  KEY `idx_wishlist_product_id` (`product_id`),
  CONSTRAINT `fk_wishlist_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_wishlist_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-26 16:03:49
