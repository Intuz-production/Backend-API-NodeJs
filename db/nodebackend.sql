-- phpMyAdmin SQL Dump
-- version 4.6.6
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 15, 2018 at 03:18 PM
-- Server version: 5.6.35-1+deb.sury.org~xenial+0.1-log
-- PHP Version: 5.6.30-1+deb.sury.org~xenial+1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nodebackend`
--

-- --------------------------------------------------------

--
-- Table structure for table `cms_management`
--

CREATE TABLE `cms_management` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(60) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int(11) NOT NULL DEFAULT '1',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_by` int(11) DEFAULT NULL,
  `modified_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `cms_management`
--

INSERT INTO `cms_management` (`id`, `title`, `content`, `type`, `status`, `created_by`, `created_date`, `modified_by`, `modified_date`) VALUES
(1, 'Terms of Use', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Congue eu consequat ac felis. Venenatis cras sed felis eget velit aliquet sagittis. Luctus venenatis lectus magna fringilla urna porttitor. Augue neque gravida in fermentum. In metus vulputate eu scelerisque felis.&nbsp;</p><p>Ac auctor augue mauris augue neque gravida in fermentum. Felis bibendum ut tristique et. Varius quam quisque id diam vel quam elementum. Sit amet nulla facilisi morbi tempus iaculis. Risus nec feugiat in fermentum posuere urna nec tincidunt. Mattis enim ut tellus elementum sagittis vitae et. Dui vivamus arcu felis bibendum ut tristique et egestas.&nbsp;</p><p>Enim sed faucibus turpis in eu mi bibendum. Urna duis convallis convallis tellus id interdum velit. Id volutpat lacus laoreet non curabitur gravida arcu. Vitae congue mauris rhoncus aenean vel. Ut eu sem integer vitae justo.</p><p>Volutpat diam ut venenatis tellus in metus vulputate eu scelerisque. Neque vitae tempus quam pellentesque. Nunc sed id semper risus in hendrerit gravida. Integer vitae justo eget magna fermentum. Placerat orci nulla pellentesque dignissim. Consequat mauris nunc congue nisi vitae suscipit tellus. Sagittis nisl rhoncus mattis rhoncus.&nbsp;</p><p>Ut pharetra sit amet aliquam id diam maecenas. Laoreet suspendisse interdum consectetur libero id. Eu lobortis elementum nibh tellus molestie. Pharetra massa massa ultricies mi. Morbi enim nunc faucibus a pellentesque sit amet porttitor.</p>', 'terms', 1, 1, '2018-02-05 19:03:20', NULL, NULL),
(2, 'Privacy Policy', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Congue eu consequat ac felis. Venenatis cras sed felis eget velit aliquet sagittis. Luctus venenatis lectus magna fringilla urna porttitor. Augue neque gravida in fermentum. In metus vulputate eu scelerisque felis. Ac auctor augue mauris augue neque gravida in fermentum. <br><br>Felis bibendum ut tristique et. Varius quam quisque id diam vel quam elementum. Sit amet nulla facilisi morbi tempus iaculis. Risus nec feugiat in fermentum posuere urna nec tincidunt. Mattis enim ut tellus elementum sagittis vitae et. Dui vivamus arcu felis bibendum ut tristique et egestas. Enim sed faucibus turpis in eu mi bibendum. Urna duis convallis convallis tellus id interdum velit. Id volutpat lacus laoreet non curabitur gravida arcu. Vitae congue mauris rhoncus aenean vel. Ut eu sem integer vitae justo.</p><p>Volutpat diam ut venenatis tellus in metus vulputate eu scelerisque. Neque vitae tempus quam pellentesque. Nunc sed id semper risus in hendrerit gravida. Integer vitae justo eget magna fermentum. Placerat orci nulla pellentesque dignissim. Consequat mauris nunc congue nisi vitae suscipit tellus. Sagittis nisl rhoncus mattis rhoncus. Ut pharetra sit amet aliquam id diam maecenas. <br><br>Laoreet suspendisse interdum consectetur libero id. Eu lobortis elementum nibh tellus molestie. Pharetra massa massa ultricies mi. Morbi enim nunc faucibus a pellentesque sit amet porttitor.</p><p>Lacus laoreet non curabitur gravida arcu ac. Quis commodo odio aenean sed adipiscing. At imperdiet dui accumsan sit. Vel turpis nunc eget lorem dolor sed viverra ipsum nunc. Eget nullam non nisi est sit. A scelerisque purus semper eget duis at tellus. Facilisi cras fermentum odio eu feugiat pretium nibh ipsum consequat. Gravida quis blandit turpis cursus in. Tincidunt tortor aliquam nulla facilisi cras fermentum odio. Sed euismod nisi porta lorem. Lectus mauris ultrices eros in cursus turpis massa tincidunt. Sed enim ut sem viverra aliquet eget.</p><div></div>', 'privacy', 1, 1, '2018-02-05 19:03:20', NULL, '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `email_template`
--

CREATE TABLE `email_template` (
  `emailtemplate_id` int(11) NOT NULL,
  `emailtemplate_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `emailtemplate_subject` text CHARACTER SET latin1 NOT NULL,
  `emailtemplate_body` longtext CHARACTER SET latin1 NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0=deactive,1=active,2=deleted',
  `created_by` int(11) DEFAULT NULL COMMENT 'FK (primary key of user)',
  `created_date` datetime DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  `modified_date` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `email_template`
--

INSERT INTO `email_template` (`emailtemplate_id`, `emailtemplate_name`, `emailtemplate_subject`, `emailtemplate_body`, `status`, `created_by`, `created_date`, `modified_by`, `modified_date`) VALUES
(1, 'user_registration_admin', 'New Registration', '<p>Hello Admin,</p>\r\n\r\n<p>{first_name} {last_name} has registered with&nbsp;Application.</p>\r\n\r\n<p>Email : {email}</p>\r\n\r\n<p>&nbsp;</p>', 1, 1, '2017-01-18 06:14:25', 1, '0000-00-00 00:00:00'),
(2, 'password_reset', 'Password Reset ', '<p>Hello {first_name} {last_name},</p>\r\n\r\n<p>Follow below link to reset your password:</p>\r\n\r\n<p><a target=\"_blank\" rel=\"nofollow\">Reset Password</a></p>\r\n\r\n<p>Thanks</p>', 1, 1, '2017-02-03 11:48:16', 1, '0000-00-00 00:00:00'),
(3, 'mail_to_user_on_signup', 'Email Verification', '<p>Hello {first_name} {last_name},</p>\r\n\r\n<p>Your account has been created successfully.</p>\r\n\r\n<p>Email :&nbsp;{email}</p>\r\n\r\n<p>Password : {password}</p>\r\n\r\n<p><a target=\"_blank\" rel=\"nofollow\">Click here</a> to verify your email address and activate your account.</p>\r\n\r\n<p>Thank you.</p>', 1, 1, '2017-09-06 07:10:08', 1, '0000-00-00 00:00:00'),
(4, 'verification_mail', 'Account Verified', '<p>Hello {first_name} {last_name},</p>\n\n<p>Your account at {app_name} is verified now.</p>\n\n<p>Thanks,</p>', 1, 1, '2017-09-07 13:31:19', 0, '0000-00-00 00:00:00'),
(17, 'refer_app_to_friend', 'Referred App', '<p>Hello,</p>\r\n\r\n<p>{refer_by_name} has referred you {app_name}. Sign up with this refer code : {refer_code}</p>\r\n\r\n<p>Thank you.</p>', 1, 1, '2018-01-12 15:51:41', 0, '0000-00-00 00:00:00'),
(18, 'password_changed', 'Reset Password', '<p>Hello {first_name} {last_name},</p>\r\n\r\n<p>Your password was reset by admin</p>\r\n\r\n<p>New Password : {new_pwd}</p>\r\n\r\n<p>Thanks.</p>', 1, 1, '2018-02-06 16:38:49', 0, '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `menu_list`
--

CREATE TABLE `menu_list` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_parent` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0 = parent menu, 1 = child menu',
  `parent_menu_id` int(11) NOT NULL DEFAULT '0' COMMENT '0 = no parent',
  `action_path` varchar(255) NOT NULL,
  `function_name` varchar(255) NOT NULL,
  `menu_icon` varchar(255) NOT NULL COMMENT 'menu icon like fontawsome',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sort` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `menu_list`
--

INSERT INTO `menu_list` (`id`, `name`, `is_parent`, `parent_menu_id`, `action_path`, `function_name`, `menu_icon`, `status`, `sort`) VALUES
(1, 'CMS', 0, 0, '/admin/cms', '/index', 'fa fa-envelope', 1, 1),
(3, 'User Management', 0, 0, '', '', 'fa fa-users', 1, 0),
(5, 'App Users', 1, 3, '/admin/user', '/index', 'fa fa-user', 1, 0),
(11, 'Roles Management', 0, 0, '/admin/roles', '/index', 'fa fa-list', 1, 2),
(12, 'Admin Users', 1, 3, '/admin/admin-user', '/index', 'fa fa-user-secret', 1, 0),
(14, 'Settings', 0, 0, '/admin/settings', '/index', 'fa fa-gears', 1, 6),
(15, 'Email Template', 0, 0, '/admin/email-content', '/index', 'fa fa-envelope-o', 1, 5),
(16, 'Broadcasts', 0, 0, '/admin/notification', '/index', 'fa fa-bullhorn', 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` mediumtext NOT NULL,
  `type` varchar(100) NOT NULL,
  `is_seen` tinyint(1) NOT NULL DEFAULT '0',
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `permission`
--

CREATE TABLE `permission` (
  `id` int(11) NOT NULL,
  `roles_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `is_add` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = no access, 1 = access',
  `is_update` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = no access, 1 = access',
  `is_delete` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = no access, 1 = access',
  `is_view` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = no access, 1 = access',
  `is_publish` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = no access, 1 = access',
  `created_by` int(11) DEFAULT NULL COMMENT 'FK (primary key of user)',
  `created_date` datetime DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  `modified_date` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0 - Inactive, 1 - Active, 2 - Deleted'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `permission`
--

INSERT INTO `permission` (`id`, `roles_id`, `menu_id`, `is_add`, `is_update`, `is_delete`, `is_view`, `is_publish`, `created_by`, `created_date`, `modified_by`, `modified_date`, `status`) VALUES
(1, 1, 0, 1, 1, 1, 1, 1, 1, '2018-03-07 19:49:59', NULL, NULL, 1),
(135, 4, 1, 1, 0, 0, 0, 0, 1, '2018-03-09 14:57:38', NULL, NULL, 1),
(136, 4, 2, 0, 1, 0, 0, 0, 1, '2018-03-09 14:57:38', NULL, NULL, 1),
(137, 4, 5, 0, 0, 1, 0, 0, 1, '2018-03-09 14:57:38', NULL, NULL, 1),
(138, 4, 6, 0, 0, 0, 1, 0, 1, '2018-03-09 14:57:38', NULL, NULL, 1),
(139, 4, 7, 0, 0, 0, 0, 1, 1, '2018-03-09 14:57:38', NULL, NULL, 1),
(154, 3, 11, 1, 0, 0, 0, 0, 1, '2018-03-13 11:20:06', NULL, NULL, 1),
(160, 5, 12, 1, 1, 0, 0, 0, 1, '2018-03-16 18:53:21', NULL, NULL, 1),
(161, 6, 5, 1, 0, 0, 0, 0, 1, '2018-03-16 18:55:14', NULL, NULL, 1),
(171, 2, 5, 0, 0, 0, 1, 1, 1, '2018-11-15 11:24:45', NULL, NULL, 1),
(172, 2, 12, 0, 0, 0, 1, 0, 1, '2018-11-15 11:24:45', NULL, NULL, 1),
(173, 2, 16, 0, 0, 0, 1, 0, 1, '2018-11-15 11:24:45', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'FK (primary key of user)',
  `created_date` datetime DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  `modified_date` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0 - Inactive, 1 - Active, 2 - Deleted'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_by`, `created_date`, `modified_by`, `modified_date`, `status`) VALUES
(1, 'superadmin', 1, '2018-03-07 19:49:59', NULL, NULL, 1),
(2, 'subadmin', 1, '2018-03-08 15:13:50', 1, '2018-11-15 11:24:45', 1);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `settingId` int(11) NOT NULL,
  `settingKey` varchar(55) NOT NULL,
  `settingValue` varchar(55) NOT NULL,
  `updatedOn` datetime DEFAULT NULL,
  `updatedBy` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`settingId`, `settingKey`, `settingValue`, `updatedOn`, `updatedBy`) VALUES
(1, 'project_name', 'My Application', '2018-11-14 18:14:33', 1),
(2, 'project_description', 'Node js admin panel', '2018-11-14 11:04:12', 1),
(3, 'setting_email', 'admin@example.com', '2018-05-02 17:24:23', 1),
(4, 'setting_logo_image', 'logo.png', '2018-11-14 11:06:24', 1),
(5, 'setting_favicon_image', 'logo-mini.png', '2018-05-02 17:24:23', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `status` smallint(6) NOT NULL DEFAULT '1' COMMENT '1=active,0=deactive,2=deleted',
  `auth_key` varchar(32) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `bio` text,
  `profile_banner_photo` varchar(255) DEFAULT NULL,
  `profile_pic` varchar(255) DEFAULT NULL,
  `role_id` int(11) NOT NULL COMMENT '1 = superadmin, 0 = user',
  `latitude` varchar(255) DEFAULT NULL,
  `longitude` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL COMMENT 'admin/subadmin address',
  `zipcode` varchar(255) DEFAULT NULL,
  `push_notification` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0 - off, 1 - on',
  `social_type` varchar(255) DEFAULT NULL,
  `social_id` varchar(255) DEFAULT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `device_type` varchar(255) DEFAULT NULL,
  `phone_international` varchar(50) DEFAULT NULL,
  `phone_national` varchar(50) DEFAULT NULL,
  `phone_e164` varchar(50) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'FK (primary key of user)',
  `created_date` datetime DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  `modified_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `first_name`, `last_name`, `phone`, `email`, `status`, `auth_key`, `password`, `password_reset_token`, `bio`, `profile_banner_photo`, `profile_pic`, `role_id`, `latitude`, `longitude`, `address`, `zipcode`, `push_notification`, `social_type`, `social_id`, `device_token`, `device_type`, `phone_international`, `phone_national`, `phone_e164`, `country_code`, `created_by`, `created_date`, `modified_by`, `modified_date`) VALUES
(1, 'Super ', 'Admin', '1234567890', 'admin@example.com', 1, '', '$2a$10$miDOPM58DU6ukYPO0fpcreKpYAGOTViaJz3qfJ.oFqkcKaEBJqBD6', '', '', '', '257271851042338600.jpg', 1, '', '', 'Test addr', '21202', 1, '', '', '', '', NULL, NULL, NULL, NULL, NULL, '2018-01-01 19:20:18', 1, '2018-11-14 19:20:18'),
(12, 'Andy', ' Richards', '1234567891', 'aa@example.com', 1, NULL, '$2a$10$Dyv2l7klPE1ZqQrITyKtqOk5TmHb9a3/58QxTRPjY5WFufNUcBW/u', NULL, 'This is test data.', '1048175615542989800.jpg', '', 0, '23.0536039', '72.5195122', 'Admin', NULL, 1, NULL, NULL, '', '', '+91 123-456-7890', '01234567890', '+911234567890', '+91', 1, '2018-03-01 11:23:14', 1, '0000-00-00 00:00:00'),
(19, 'Martin', ' Guliver', '1234567892', 'bb@example.com', 1, NULL, '$2a$10$a7tC0bSjY7wYs.0y2MnzSOS42FjnIwv2FfNYIhKZQAAiCm3sWMU4W', '', '', NULL, NULL, 0, '20.21221', NULL, NULL, NULL, 1, NULL, NULL, '', '', '+1 987-654-3210', '(123)456-7890', '+11234567890', '+1', 1, '2018-03-22 05:34:04', NULL, '2018-03-22 06:50:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cms_management`
--
ALTER TABLE `cms_management`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `email_template`
--
ALTER TABLE `email_template`
  ADD PRIMARY KEY (`emailtemplate_id`);

--
-- Indexes for table `menu_list`
--
ALTER TABLE `menu_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_id_idx` (`user_id`);

--
-- Indexes for table `permission`
--
ALTER TABLE `permission`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`settingId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cms_management`
--
ALTER TABLE `cms_management`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `email_template`
--
ALTER TABLE `email_template`
  MODIFY `emailtemplate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;
--
-- AUTO_INCREMENT for table `menu_list`
--
ALTER TABLE `menu_list`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `permission`
--
ALTER TABLE `permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=174;
--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `settingId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
