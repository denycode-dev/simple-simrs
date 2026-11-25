<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\AuditLog;
use app\models\User;
use yii\filters\auth\HttpBearerAuth;

/**
 * AuthController handles REST API authentication operations (login, me, logout).
 */
class AuthController extends BaseApiController
{
    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        // Apply HttpBearerAuth only to protected endpoints
        $behaviors['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'only' => ['me', 'logout'],
            'except' => ['login', 'options'],
        ];

        return $behaviors;
    }

    /**
     * Authenticates a user with username and password, returning a Bearer access token.
     *
     * Route: POST /api/v1/auth/login
     * @return array Standardized JSON envelope
     */
    public function actionLogin(): array
    {
        $body = Yii::$app->request->getBodyParams();
        $username = trim((string)($body['username'] ?? ''));
        $password = (string)($body['password'] ?? '');

        $errors = [];
        if ($username === '') {
            $errors['username'] = ['Username wajib diisi.'];
        }
        if ($password === '') {
            $errors['password'] = ['Password wajib diisi.'];
        }
        if (!empty($errors)) {
            return $this->asValidationError($errors, 'Validasi input login gagal');
        }

        $user = User::findByUsername($username);
        if ($user === null || !$user->validatePassword($password)) {
            return $this->asError('Nama pengguna atau kata sandi tidak valid.', 401);
        }

        if (!$user->is_active) {
            return $this->asError('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.', 403);
        }

        if (empty($user->access_token)) {
            $user->generateAccessToken();
        }

        $overrideUserId = (!$user->isNewRecord && $user->id !== null) ? (int)$user->id : null;
        AuditLog::log(
            'AUTH',
            'LOGIN',
            $user->id !== null ? (string)$user->id : null,
            [
                'username' => $user->username,
                'role' => $user->role,
            ],
            null,
            [
                'username' => $user->username,
                'full_name' => $user->full_name,
                'role' => $user->role,
            ],
            $overrideUserId
        );

        return $this->asSuccess([
            'token' => $user->access_token,
            'tokenType' => 'Bearer',
            'user' => [
                'id' => (int) $user->id,
                'username' => $user->username,
                'fullName' => $user->full_name,
                'role' => $user->role,
            ],
        ], 'Autentikasi berhasil.');
    }

    /**
     * Retrieves the profile information of the currently authenticated user.
     *
     * Route: GET /api/v1/auth/me
     * @return array Standardized JSON envelope
     */
    public function actionMe(): array
    {
        /** @var User|null $user */
        $user = Yii::$app->user->identity;
        if ($user === null) {
            return $this->asError('Autentikasi gagal. Token Bearer diperlukan.', 401);
        }

        return $this->asSuccess([
            'id' => (int) $user->id,
            'username' => $user->username,
            'fullName' => $user->full_name,
            'role' => $user->role,
            'isActive' => (bool) $user->is_active,
        ], 'Data profil pengguna berhasil dimuat.');
    }

    /**
     * Terminates the current authenticated session by invalidating the access token.
     *
     * Route: POST /api/v1/auth/logout
     * @return array Standardized JSON envelope
     */
    public function actionLogout(): array
    {
        /** @var User|null $user */
        $user = Yii::$app->user->identity;
        if ($user !== null) {
            $overrideUserId = (!$user->isNewRecord && $user->id !== null) ? (int)$user->id : null;
            $user->access_token = null;
            if (!$user->isNewRecord) {
                $user->updateAttributes([
                    'access_token' => null,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }

            AuditLog::log(
                'AUTH',
                'LOGOUT',
                $user->id !== null ? (string)$user->id : null,
                [
                    'username' => $user->username,
                    'role' => $user->role,
                ],
                null,
                [
                    'username' => $user->username,
                    'role' => $user->role,
                ],
                $overrideUserId
            );
        }

        return $this->asSuccess(null, 'Sesi berhasil diakhiri.');
    }
}
