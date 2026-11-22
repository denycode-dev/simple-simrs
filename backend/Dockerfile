
FROM php:8.4-apache

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and PHP extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libicu-dev \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install -j"$(nproc)" \
    intl \
    mbstring \
    opcache \
    pdo_pgsql \
    zip \
    && a2enmod rewrite \
    && printf '<Directory /var/www/html/web>\n    AllowOverride All\n    Require all granted\n</Directory>\n' \
    > /etc/apache2/conf-available/yii2.conf \
    && a2enconf yii2 \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configure Apache DocumentRoot
ENV APACHE_DOCUMENT_ROOT=/var/www/html/web

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Copy Yii2 application
COPY . .

# Install PHP dependencies
RUN composer install \
    --no-interaction \
    --prefer-dist

# Prepare writable directories
RUN mkdir -p runtime web/assets \
    && chown -R www-data:www-data runtime web/assets

EXPOSE 80
